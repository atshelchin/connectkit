<script lang="ts">
	import { getRecommendedMobileWallets, openWalletDeepLink } from '../utils/mobile.js';
	import Modal from './modal.svelte';

	interface Props {
		open: boolean;
		uri: string;
		onClose: () => void;
		onWalletSelect?: (walletId: string) => void;
	}

	let { open = false, uri, onClose, onWalletSelect }: Props = $props();

	const wallets = getRecommendedMobileWallets();

	function selectWallet(walletId: string) {
		onWalletSelect?.(walletId);
		openWalletDeepLink(uri, walletId);
		onClose();
	}

	function copyUri() {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(uri);
		}
	}
</script>

<Modal {open} {onClose} title="选择钱包">
	<div class="wallet-selector">
		<p class="instruction">选择一个钱包连接到此应用</p>

		<div class="wallet-list">
			{#each wallets as wallet (wallet.id)}
				<button class="wallet-item" onclick={() => selectWallet(wallet.id)}>
					<span class="wallet-name">{wallet.name}</span>
					<svg class="arrow-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
						<path
							d="M6 12l4-4-4-4"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			{/each}
		</div>

		<div class="alternative-options">
			<button class="copy-button" onclick={copyUri}>
				<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<rect x="4.5" y="4.5" width="7" height="7" rx="1" stroke="currentColor" />
					<path
						d="M8.5 4.5V3.5C8.5 2.94772 8.05228 2.5 7.5 2.5H3.5C2.94772 2.5 2.5 2.94772 2.5 3.5V7.5C2.5 8.05228 2.94772 8.5 3.5 8.5H4.5"
						stroke="currentColor"
					/>
				</svg>
				复制连接链接
			</button>
		</div>
	</div>
</Modal>

<style>
	.wallet-selector {
		padding: 1rem 0;
	}

	.instruction {
		margin: 0 0 1.5rem;
		color: var(--text-secondary, #666);
		text-align: center;
		font-size: 0.875rem;
	}

	.wallet-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.wallet-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 1rem;
		background: var(--button-bg, #f5f5f5);
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 1rem;
		color: var(--text-primary, #000);
	}

	.wallet-item:hover {
		background: var(--button-hover-bg, #ebebeb);
		transform: translateY(-1px);
	}

	.wallet-name {
		font-weight: 500;
	}

	.arrow-icon {
		flex-shrink: 0;
		color: var(--text-secondary, #666);
	}

	.alternative-options {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color, #e0e0e0);
		display: flex;
		justify-content: center;
	}

	.copy-button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: transparent;
		border: 1px solid var(--border-color, #e0e0e0);
		border-radius: 8px;
		cursor: pointer;
		color: var(--text-secondary, #666);
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.copy-button:hover {
		background: var(--button-bg, #f5f5f5);
		color: var(--text-primary, #000);
	}
</style>
