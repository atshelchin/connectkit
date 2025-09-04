<script lang="ts">
	import Modal from './modal.svelte';
	import EthereumIdentity from './ethereum-identity.svelte';
	import NetworkSelector from './network-selector.svelte';
	import Alert from './alert.svelte';
	import ChainSwitchFeedback from './chain-switch-feedback.svelte';
	import {
		hasValidSIWESession,
		generateNonce,
		createSIWEMessage,
		storeSIWESession,
		clearSIWESession
	} from '../utils/siwe.js';
	import type { SIWESession } from '../connectors/types.js';
	import AddressDisplay from './address-display.svelte';
	interface Props {
		open: boolean;
		onClose: () => void;
		address: string;
		addresses?: string[];
		balance?: string;
		chainId?: number;
		onDisconnect?: () => void;
		onChainSwitch?: (chainId: number) => void;
		onAccountSwitch?: (address: string) => void;
		onSignMessage?: (message: string) => Promise<string>;
		mainnet?: boolean;
	}

	let {
		open = false,
		onClose,
		address,
		addresses = [],
		balance = '0.0',
		chainId = 1,
		onDisconnect,
		onChainSwitch,
		onAccountSwitch,
		onSignMessage,
		mainnet = false
	}: Props = $props();

	let isSignedIn = $state(false);
	let signingIn = $state(false);
	let showAccountSelector = $state(false);
	let copied = $state(false);
	let switchError = $state<string | undefined>();
	let isSwitchingChain = $state(false);
	let switchFeedback = $state<'loading' | 'error' | 'success' | null>(null);
	let switchFeedbackMessage = $state<string>('');

	// Track chain for reverting on failure - initialize with current chainId
	let displayedChainId = $state(chainId || 1);
	// let targetChainId = $state<number | null>(null);

	// Update displayed chain when actual chain changes successfully
	$effect(() => {
		// Only update if not currently switching and chainId is defined
		if (!isSwitchingChain && chainId) {
			console.log('[AccountModal] Updating displayedChainId from prop:', chainId);
			displayedChainId = chainId;
		}
	});

	// Check SIWE session on mount and when address changes
	$effect(() => {
		if (address) {
			isSignedIn = hasValidSIWESession(address);
		}
	});

	// Handle SIWE sign in
	async function handleSignIn() {
		if (!onSignMessage || !address || !chainId) return;

		signingIn = true;
		try {
			const nonce = generateNonce();
			const domain = window.location.host;
			const expirationTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

			const message = createSIWEMessage({
				address,
				chainId,
				domain,
				nonce,
				statement: 'Sign in with Ethereum to ConnectKit',
				expirationTime
			});

			const signature = await onSignMessage(message);

			const session: SIWESession = {
				address,
				chainId,
				signature,
				message,
				nonce,
				domain,
				issuedAt: new Date().toISOString(),
				expirationTime
			};

			storeSIWESession(session);
			isSignedIn = true;
		} catch (error) {
			console.error('Failed to sign in:', error);
		} finally {
			signingIn = false;
		}
	}

	// Handle copy address
	async function handleCopy() {
		if (!address || !navigator.clipboard) return;

		try {
			await navigator.clipboard.writeText(address);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy address:', err);
		}
	}

	// Handle account switch
	async function handleAccountSelect(newAddress: string) {
		if (onAccountSwitch) {
			await onAccountSwitch(newAddress);
			showAccountSelector = false;
		}
	}

	// Handle chain switch with error handling
	async function handleChainSwitch(newTargetChainId: number) {
		if (!onChainSwitch) return;

		// Don't attempt to switch if we're in an invalid state
		if (!address) {
			console.warn('[AccountModal] Cannot switch chain - no wallet connected');
			return;
		}

		// Prevent multiple simultaneous switches
		if (isSwitchingChain) {
			console.warn('[AccountModal] Chain switch already in progress');
			return;
		}

		// Store the current chain before switching - use displayedChainId which tracks the actual current chain
		const previousChain = displayedChainId || chainId || 1;
		console.log(
			'[AccountModal] Current displayedChainId:',
			displayedChainId,
			'chainId:',
			chainId,
			'previousChain:',
			previousChain
		);

		switchError = undefined;
		isSwitchingChain = true;
		targetChainId = newTargetChainId;
		switchFeedback = 'loading';
		switchFeedbackMessage = '切换中...';

		// Optimistically update the displayed chain
		displayedChainId = newTargetChainId;

		try {
			await onChainSwitch(newTargetChainId);
			// Success - the actual chainId will update via props
			switchFeedback = 'success';
			switchFeedbackMessage = '切换成功';
			targetChainId = null;
			// Auto-hide success after 2 seconds
			setTimeout(() => {
				switchFeedback = null;
			}, 2000);
		} catch (error) {
			console.error(
				'[AccountModal] Chain switch failed, attempting to revert to chain:',
				previousChain
			);
			const err = error as Error;

			// Show user-friendly error message
			let errorMsg = '切换网络失败';
			if (err.message.includes('No connector connected')) {
				errorMsg = '钱包未连接';
			} else if (err.message) {
				errorMsg = err.message;
			}

			// Try to switch back to the previous chain (only if it's different from target)
			if (previousChain !== newTargetChainId) {
				try {
					console.log('[AccountModal] Attempting to revert to previous chain:', previousChain);
					await onChainSwitch(previousChain);
					console.log('[AccountModal] Successfully reverted to previous chain');

					// Update UI to show we're back on the previous chain
					displayedChainId = previousChain;
					switchFeedback = 'error';
					switchFeedbackMessage = errorMsg + '，已切回原网络';
				} catch (revertError) {
					console.error('[AccountModal] Failed to revert to previous chain:', revertError);
					// Even if revert fails, stay on current chain
					// The wallet is likely still on the previous chain anyway
					displayedChainId = previousChain;
					switchFeedback = 'error';
					switchFeedbackMessage = errorMsg + '，保持在当前网络';
				}
			} else {
				// Can't revert to same chain
				displayedChainId = chainId || 1;
				switchFeedback = 'error';
				switchFeedbackMessage = errorMsg;
			}

			targetChainId = null;
			switchError = errorMsg;

			// Auto-hide error after 5 seconds
			setTimeout(() => {
				switchFeedback = null;
			}, 5000);
		} finally {
			isSwitchingChain = false;
		}
	}
</script>

<Modal {open} {onClose}>
	<div class="account-modal">
		<!-- Header with Connected status -->
		<div class="modal-header">
			<div class="status">
				<div class="status-dot"></div>
				<span>已连接</span>
			</div>
			<button class="close-button" onclick={onClose} aria-label="Close">
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
					<path
						d="M1 1L13 13M1 13L13 1"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</div>

		<!-- Account info section -->
		<div class="account-section">
			<!-- Simplified layout with avatar and selectors -->
			<div class="identity-wrapper">
				<!-- Just show avatar, no address since it's in the dropdown -->
				<div class="avatar-container">
					<EthereumIdentity
						{address}
						{mainnet}
						showAvatar={true}
						showAddress={false}
						avatarSize="lg"
						showCopy={false}
					/>
				</div>

				<div class="selectors-container">
					<!-- Account selector with copy button -->
					<div class="account-row">
						<div class="account-selector-container">
							<button
								class="account-selector-trigger"
								onclick={() => (showAccountSelector = !showAccountSelector)}
								disabled={!addresses || addresses.length <= 1}
							>
								<AddressDisplay {address} showCopyIcon={false} />

								{#if addresses && addresses.length > 1}
									<svg
										class="selector-chevron"
										class:rotate={showAccountSelector}
										width="12"
										height="12"
										viewBox="0 0 12 12"
										fill="none"
									>
										<path
											d="M3 5L6 8L9 5"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
										/>
									</svg>
								{/if}
							</button>

							{#if showAccountSelector && addresses && addresses.length > 1}
								<div class="account-dropdown">
									{#each addresses as addr (addr)}
										<button
											class="account-option"
											class:selected={addr === address}
											onclick={() => handleAccountSelect(addr)}
										>
											<EthereumIdentity
												address={addr}
												{mainnet}
												showAvatar={true}
												showAddress={true}
												avatarSize="sm"
												showCopy={false}
											/>
											{#if addr === address}
												<svg
													class="check-icon"
													width="16"
													height="16"
													viewBox="0 0 16 16"
													fill="var(--color-primary)"
												>
													<path d="M6 11L3 8L4.5 6.5L6 8L11.5 2.5L13 4L6 11Z" fill="currentColor" />
												</svg>
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Copy address button -->
						<button
							class="copy-button"
							class:copied
							onclick={handleCopy}
							title={copied ? '已复制' : '复制地址'}
						>
							{#if !copied}
								<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
									<rect x="5.5" y="5.5" width="8" height="8" rx="1" stroke="currentColor" />
									<path
										d="M3.5 10.5V3.5C3.5 2.94772 3.94772 2.5 4.5 2.5H11.5"
										stroke="currentColor"
									/>
								</svg>
							{:else}
								<svg
									class="check-icon-copy"
									width="16"
									height="16"
									viewBox="0 0 16 16"
									fill="currentColor"
								>
									<path d="M6 11L3 8L4.5 6.5L6 8L11.5 2.5L13 4L6 11Z" />
								</svg>
							{/if}
						</button>
					</div>

					{#if switchError}
						<Alert
							type="error"
							message={switchError}
							onClose={() => (switchError = undefined)}
							autoClose={8000}
							class="switch-error-margin"
						/>
					{/if}

					<div class="network-siwe-row">
						<!-- Network selector component with feedback -->
						<div class="network-selector-wrapper">
							<NetworkSelector chainId={displayedChainId} onChainSwitch={handleChainSwitch} />
							<ChainSwitchFeedback
								show={switchFeedback !== null}
								type={switchFeedback || 'loading'}
								message={switchFeedbackMessage}
							/>
						</div>
						<!-- SIWE Status -->
						<div class="siwe-section">
							{#if isSignedIn}
								<div class="siwe-status signed-in">
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
										<circle cx="8" cy="8" r="7" stroke="var(--color-success)" stroke-width="1.5" />
										<path
											d="M5 8L7 10L11 6"
											stroke="var(--color-success)"
											stroke-width="1.5"
											stroke-linecap="round"
										/>
									</svg>
									<span>已通过 SIWE 认证</span>
									<!-- <button class="sign-out-btn" onclick={handleSignOut} title="登出">
										<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
											<path
												d="M10 4L14 8M14 8L10 12M14 8H6M6 2H4C3.44772 2 2 3.44772 2 4V12C2 13.1046 2.89543 14 4 14H6"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</button> -->
								</div>
							{:else}
								<div class="siwe-status">
									<span>未认证</span>
									<button
										class="sign-in-btn"
										onclick={handleSignIn}
										disabled={signingIn || !onSignMessage}
									>
										{signingIn ? '认证中...' : 'Sign-In with Ethereum'}
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Balance display -->
			<div class="balance-section">
				<span class="balance-label">余额</span>
				<span class="balance-value">{balance} ETH</span>
			</div>
		</div>

		<!-- Actions section -->
		<div class="actions-section">
			<button
				class="disconnect-button"
				onclick={() => {
					// Clear SIWE session when disconnecting
					if (address) {
						clearSIWESession(address);
					}
					onDisconnect?.();
					onClose();
				}}
			>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path
						d="M10 4L14 8M14 8L10 12M14 8H5M5 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H5"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span>断开连接</span>
			</button>
		</div>
	</div>
</Modal>

<style>
	.account-modal {
		padding: var(--space-6);
		min-width: 320px;
		width: 100%;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-6);
	}

	.status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
	}

	.status-dot {
		width: 8px;
		height: 8px;
		background: #10b981;
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes check-bounce {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--color-muted-foreground);
		cursor: pointer;
		border-radius: var(--radius);
		transition: all 150ms ease;
	}

	.close-button:hover {
		background: var(--color-muted);
		color: var(--color-foreground);
	}

	.account-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-6) 0;
		border-top: 1px solid var(--color-border);
		border-bottom: 1px solid var(--color-border);
	}

	.identity-wrapper {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		width: 100%;
	}

	.avatar-container {
		flex-shrink: 0;
	}

	.selectors-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.account-row {
		display: flex;
		gap: var(--space-2);
		align-items: stretch;
	}

	.account-row .account-selector-container {
		flex: 1;
	}

	.copy-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-2);
		background: var(--color-panel-1);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-muted-foreground);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.copy-button:hover:not(.copied) {
		background: var(--color-muted);
		border-color: var(--color-border-hover);
		color: var(--color-foreground);
	}

	.copy-button:active:not(.copied) {
		transform: scale(0.95);
	}

	.copy-button.copied {
		color: var(--color-success, #10b981);
	}

	.copy-button svg {
		transition: all 150ms ease;
	}

	.copy-button .check-icon-copy {
		animation: check-bounce 300ms ease;
	}

	.balance-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		width: 100%;
		padding: var(--space-3);
		background: var(--color-muted);
		border-radius: var(--radius);
	}

	.balance-label {
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.balance-value {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-foreground);
	}

	.account-selector-container {
		position: relative;
	}

	.account-selector-trigger {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-panel-1);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 150ms ease;
		width: 100%;
	}

	.account-selector-trigger:hover:not(:disabled) {
		background: var(--color-muted);
		border-color: var(--color-border-hover);
	}

	.account-selector-trigger:disabled {
		cursor: default;
		opacity: 1;
	}

	.selector-label {
		color: var(--color-muted-foreground);
		font-size: var(--text-xs);
	}

	.selector-value {
		font-weight: var(--font-medium);
	}

	.selector-chevron {
		transition: transform 150ms ease;
	}

	.selector-chevron.rotate {
		transform: rotate(180deg);
	}

	.account-dropdown {
		position: absolute;
		top: calc(100% + var(--space-1));
		left: 0;
		right: 0;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		box-shadow: var(--shadow-lg);
		z-index: 50;
		max-height: 300px;
		overflow-y: auto;
	}

	.account-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--space-3);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 150ms ease;
		text-align: left;
	}

	.account-option:hover {
		background: var(--color-muted);
	}

	.account-option.selected {
		background: var(--color-panel-1);
	}

	.check-icon {
		margin-left: auto;
		flex-shrink: 0;
		color: var(--color-primary, #3b82f6);
	}

	/* Use global to style the Alert component when used here */
	:global(.switch-error-margin) {
		margin-bottom: var(--space-3);
	}

	.network-siwe-row {
		display: flex;
		gap: var(--space-2);
		align-items: stretch;
	}

	.network-selector-wrapper {
		position: relative;
		flex-shrink: 0;
	}

	.network-siwe-row > :global(.network-selector) {
		flex-shrink: 0;
	}

	.siwe-section {
		flex: 1;
		padding: var(--space-3);
		background: var(--color-panel-1);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		display: flex;
		align-items: center;
	}

	.siwe-status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		width: 100%;
	}

	.siwe-status.signed-in {
		color: var(--color-success);
	}

	.sign-in-btn {
		margin-left: auto;
		padding: var(--space-1) var(--space-3);
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.sign-out-btn {
		margin-left: auto;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		background: transparent;
		color: var(--color-muted-foreground);
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.sign-in-btn:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.sign-out-btn:hover {
		background: var(--color-muted);
		color: var(--color-destructive, #dc2626);
	}

	.sign-in-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.actions-section {
		padding-top: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.disconnect-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-3);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-muted-foreground);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.disconnect-button:hover {
		background: var(--color-destructive-bg, #fee2e2);
		color: var(--color-destructive, #dc2626);
		border-color: var(--color-destructive, #dc2626);
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.account-modal {
			padding: var(--space-4);
			min-width: 280px;
		}
	}
</style>
