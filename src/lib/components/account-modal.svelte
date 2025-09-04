<script lang="ts">
	import Modal from './modal.svelte';
	import EthereumIdentity from './ethereum-identity.svelte';
	import NetworkSelector from './network-selector.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		address: string;
		balance?: string;
		chainId?: number;
		onDisconnect?: () => void;
		onChainSwitch?: (chainId: number) => void;
		mainnet?: boolean;
	}

	let {
		open = false,
		onClose,
		address,
		balance = '0.0',
		chainId = 1,
		onDisconnect,
		onChainSwitch,
		mainnet = false
	}: Props = $props();
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
			<!-- Avatar with chain badge -->
			<div class="identity-wrapper">
				<EthereumIdentity
					{address}
					{mainnet}
					showAvatar={true}
					showAddress={true}
					avatarSize="lg"
					showCopy={false}
				/>
				<!-- Network selector component -->
				<NetworkSelector {chainId} {onChainSwitch} />
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
		flex-direction: row;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
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
