<script lang="ts">
	import { onMount } from 'svelte';

	// EIP-6963 types
	interface EIP6963ProviderInfo {
		uuid: string;
		name: string;
		icon: string;
		rdns: string;
	}

	interface EthereumProvider {
		request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
		on: (event: string, handler: (...args: unknown[]) => void) => void;
		removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
	}

	interface EIP6963ProviderDetail {
		info: EIP6963ProviderInfo;
		provider: EthereumProvider;
	}

	interface EIP6963AnnounceProviderEvent extends CustomEvent {
		detail: EIP6963ProviderDetail;
	}

	interface Props {
		showCoinbaseWallet?: boolean;
		showWalletConnect?: boolean;
		onWalletClick?: (wallet: { type: string; info?: EIP6963ProviderInfo }) => void;
		className?: string;
	}

	let {
		showCoinbaseWallet = true,
		showWalletConnect = true,
		onWalletClick,
		className = ''
	}: Props = $props();

	// State for discovered wallets
	let discoveredWallets = $state<EIP6963ProviderDetail[]>([]);
	let isDiscovering = $state(true);

	// Discover wallets via EIP-6963
	onMount(() => {
		const wallets: Record<string, EIP6963ProviderDetail> = {};

		// Listen for wallet announcements
		const handleAnnouncement = (event: EIP6963AnnounceProviderEvent) => {
			const { detail } = event;
			if (detail?.info?.uuid) {
				wallets[detail.info.uuid] = detail;
				discoveredWallets = Object.values(wallets);
				console.log('EIP-6963: Discovered wallet', detail.info.name);
			}
		};

		window.addEventListener('eip6963:announceProvider', handleAnnouncement as EventListener);

		// Request wallet providers - delay slightly to ensure listeners are ready
		setTimeout(() => {
			console.log('EIP-6963: Requesting providers...');
			window.dispatchEvent(new Event('eip6963:requestProvider'));
		}, 100);

		// Stop discovering after a longer delay to give wallets time to respond
		const timer = setTimeout(() => {
			isDiscovering = false;
			console.log('EIP-6963: Discovery complete. Found', discoveredWallets.length, 'wallets');
		}, 1500);

		return () => {
			window.removeEventListener('eip6963:announceProvider', handleAnnouncement as EventListener);
			clearTimeout(timer);
		};
	});

	// Handle wallet selection
	function handleWalletSelect(type: string, info?: EIP6963ProviderInfo) {
		onWalletClick?.({ type, info });
	}

	// Coinbase Wallet icon SVG
	const coinbaseIcon = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect width="32" height="32" rx="8" fill="#0052FF"/>
		<path d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C21.523 26 26 21.523 26 16C26 10.477 21.523 6 16 6ZM16 23.5C11.864 23.5 8.5 20.136 8.5 16C8.5 11.864 11.864 8.5 16 8.5C20.136 8.5 23.5 11.864 23.5 16C23.5 20.136 20.136 23.5 16 23.5Z" fill="white"/>
		<path d="M13.5 13.5H18.5V18.5H13.5V13.5Z" fill="white"/>
	</svg>`;

	// WalletConnect icon SVG
	const walletConnectIcon = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect width="32" height="32" rx="8" fill="#3B99FC"/>
		<path d="M10.2 12.8C13.3 9.7 18.3 9.7 21.5 12.8L21.9 13.2C22.1 13.4 22.1 13.7 21.9 13.9L20.6 15.2C20.5 15.3 20.3 15.3 20.2 15.2L19.7 14.7C17.5 12.5 14.1 12.5 12 14.7L11.4 15.3C11.3 15.4 11.1 15.4 11 15.3L9.7 14C9.5 13.8 9.5 13.5 9.7 13.3L10.2 12.8ZM23.9 15.2L25 16.3C25.2 16.5 25.2 16.8 25 17L20.1 21.9C19.9 22.1 19.6 22.1 19.4 21.9L16 18.5C16 18.4 15.9 18.4 15.8 18.5L12.4 21.9C12.2 22.1 11.9 22.1 11.7 21.9L6.8 17C6.6 16.8 6.6 16.5 6.8 16.3L7.9 15.2C8.1 15 8.4 15 8.6 15.2L12 18.6C12.1 18.7 12.2 18.7 12.3 18.6L15.7 15.2C15.9 15 16.2 15 16.4 15.2L19.8 18.6C19.9 18.7 20 18.7 20.1 18.6L23.5 15.2C23.7 15 24 15 23.9 15.2Z" fill="white"/>
	</svg>`;
</script>

<div class="wallet-list {className}">
	<!-- Discovered EIP-6963 Wallets -->
	{#if discoveredWallets.length > 0}
		<div class="wallet-section">
			<h3 class="section-title">Browser Wallets</h3>
			<div class="wallets-grid">
				{#each discoveredWallets as wallet (wallet.info.uuid)}
					<button
						class="wallet-button"
						onclick={() => handleWalletSelect('eip6963', wallet.info)}
						title={wallet.info.name}
					>
						<img src={wallet.info.icon} alt={wallet.info.name} class="wallet-icon" />
						<span class="wallet-name">{wallet.info.name}</span>
					</button>
				{/each}
			</div>
		</div>
	{:else if isDiscovering}
		<div class="discovering">
			<div class="spinner"></div>
			<span>Discovering wallets...</span>
		</div>
	{/if}

	<!-- Other Wallet Options -->
	{#if showCoinbaseWallet || showWalletConnect}
		<div class="wallet-section">
			{#if discoveredWallets.length === 0 && !isDiscovering}{:else}
				<h3 class="section-title">More Options</h3>
			{/if}

			<div class="wallets-grid">
				{#if showCoinbaseWallet}
					<button
						class="wallet-button"
						onclick={() => handleWalletSelect('coinbase')}
						title="Coinbase Smart Wallet"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html coinbaseIcon}
						<span class="wallet-name">Coinbase Wallet</span>
					</button>
				{/if}

				{#if showWalletConnect}
					<button
						class="wallet-button"
						onclick={() => handleWalletSelect('walletconnect')}
						title="WalletConnect"
					>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html walletConnectIcon}
						<span class="wallet-name">WalletConnect</span>
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<!-- No wallets message - only show if truly nothing available -->
	{#if !isDiscovering && discoveredWallets.length === 0 && !showCoinbaseWallet && !showWalletConnect}
		<div class="no-wallets">
			<p>No wallets detected</p>
			<span class="hint">Install a browser wallet extension to connect</span>
		</div>
	{/if}
</div>

<style>
	.wallet-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding: var(--space-4);
	}

	.wallet-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.section-title {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.wallets-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: var(--space-3);
	}

	.wallet-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.wallet-button:hover {
		background: var(--color-muted);
		border-color: var(--color-border-hover);
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.wallet-button:active {
		transform: translateY(0);
	}

	.wallet-icon {
		width: 48px;
		height: 48px;
		border-radius: var(--radius);
		object-fit: cover;
	}

	.wallet-button :global(svg) {
		width: 48px;
		height: 48px;
		border-radius: var(--radius);
	}

	.wallet-name {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
		text-align: center;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.discovering {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-8);
		color: var(--color-muted-foreground);
		font-size: var(--text-sm);
	}

	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.no-wallets {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		padding: var(--space-8);
		text-align: center;
	}

	.no-wallets p {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
	}

	.hint {
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.wallets-grid {
			grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		}

		.wallet-icon,
		.wallet-button :global(svg) {
			width: 40px;
			height: 40px;
		}

		.wallet-button {
			padding: var(--space-3);
		}

		.wallet-name {
			font-size: var(--text-xs);
		}
	}
</style>
