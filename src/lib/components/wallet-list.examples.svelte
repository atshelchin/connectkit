<script lang="ts">
	import WalletList from './wallet-list.svelte';
	import WalletConnecting from './wallet-connecting.svelte';
	import Modal from './modal.svelte';

	// State for examples
	let showModal = $state(false);
	interface WalletInfo {
		type: string;
		info?: {
			uuid: string;
			name: string;
			icon: string;
			rdns: string;
		};
	}

	let selectedWallet = $state<WalletInfo | null>(null);
	let showCoinbase = $state(true);
	let showWalletConnect = $state(true);

	// State switching example
	let currentView = $state<'list' | 'connecting'>('list');
	let connectingWallet = $state<{ name: string; icon?: string } | null>(null);

	// Handle wallet click
	function handleWalletClick(wallet: WalletInfo) {
		selectedWallet = wallet;
		console.log('Wallet clicked:', wallet);
	}

	// Handle wallet click with state switching
	function handleWalletClickWithSwitch(wallet: WalletInfo) {
		selectedWallet = wallet;
		const walletName =
			wallet.info?.name || (wallet.type === 'coinbase' ? 'Coinbase Wallet' : 'WalletConnect');
		connectingWallet = {
			name: walletName,
			icon:
				wallet.info?.icon ||
				(wallet.type === 'walletconnect'
					? walletConnectIcon
					: wallet.type === 'coinbase'
						? coinbaseIcon
						: undefined)
		};
		currentView = 'connecting';
		console.log('Switching to connecting state:', walletName);

		// Simulate connection process
		setTimeout(() => {
			currentView = 'list';
			connectingWallet = null;
			selectedWallet = null;
		}, 5000);
	}

	// WalletConnect icon SVG
	const walletConnectIcon = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect width="32" height="32" rx="8" fill="#3B99FC"/>
		<path d="M10.2 12.8C13.3 9.7 18.3 9.7 21.5 12.8L21.9 13.2C22.1 13.4 22.1 13.7 21.9 13.9L20.6 15.2C20.5 15.3 20.3 15.3 20.2 15.2L19.7 14.7C17.5 12.5 14.1 12.5 12 14.7L11.4 15.3C11.3 15.4 11.1 15.4 11 15.3L9.7 14C9.5 13.8 9.5 13.5 9.7 13.3L10.2 12.8ZM23.9 15.2L25 16.3C25.2 16.5 25.2 16.8 25 17L20.1 21.9C19.9 22.1 19.6 22.1 19.4 21.9L16 18.5C16 18.4 15.9 18.4 15.8 18.5L12.4 21.9C12.2 22.1 11.9 22.1 11.7 21.9L6.8 17C6.6 16.8 6.6 16.5 6.8 16.3L7.9 15.2C8.1 15 8.4 15 8.6 15.2L12 18.6C12.1 18.7 12.2 18.7 12.3 18.6L15.7 15.2C15.9 15 16.2 15 16.4 15.2L19.8 18.6C19.9 18.7 20 18.7 20.1 18.6L23.5 15.2C23.7 15 24 15 23.9 15.2Z" fill="white"/>
	</svg>`;

	// Coinbase Wallet icon SVG
	const coinbaseIcon = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
		<rect width="32" height="32" rx="8" fill="#0052FF"/>
		<path d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C21.523 26 26 21.523 26 16C26 10.477 21.523 6 16 6ZM16 23.5C11.864 23.5 8.5 20.136 8.5 16C8.5 11.864 11.864 8.5 16 8.5C20.136 8.5 23.5 11.864 23.5 16C23.5 20.136 20.136 23.5 16 23.5Z" fill="white"/>
		<path d="M13.5 13.5H18.5V18.5H13.5V13.5Z" fill="white"/>
	</svg>`;

	// Mock discovered wallets for demo
	const mockWallets = [
		{
			info: {
				uuid: 'metamask',
				name: 'MetaMask',
				icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0Y2ODUxQiIvPgo8cGF0aCBkPSJNMzAuNCAxMS42TDIxLjYgMTguMUwyMy4zIDE0LjFMMzAuNCAxMS42WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTkuNiAxMS42TDE4LjMgMTguMkwxNi43IDE0LjFMOS42IDExLjZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjYuNyAyNC40TDI0LjMgMjguMkwyOS40IDI5LjZMMzAuOSAyNC41TDI2LjcgMjQuNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik05LjEgMjQuNUwxMC42IDI5LjZMMTUuNyAyOC4yTDEzLjMgMjQuNEw5LjEgMjQuNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
				rdns: 'io.metamask'
			},
			provider: {}
		},
		{
			info: {
				uuid: 'rabby',
				name: 'Rabby Wallet',
				icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzcwODRGMyIvPgo8Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSI1IiBmaWxsPSJ3aGl0ZSIvPgo8Y2lyY2xlIGN4PSIyNSIgY3k9IjE1IiByPSI1IiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMTUgMjBMMjAgMjVMMjUgMjBWMjVDMjUgMjcuNSAyMi41IDMwIDIwIDMwQzE3LjUgMzAgMTUgMjcuNSAxNSAyNVYyMFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
				rdns: 'com.rabby'
			},
			provider: {}
		},
		{
			info: {
				uuid: 'rainbow',
				name: 'Rainbow',
				icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxsaW5lYXJHcmFkaWVudCBpZD0icmFpbmJvdyI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRjAwMDAiLz4KPHN0b3Agb2Zmc2V0PSIxNi42NiUiIHN0b3AtY29sb3I9IiNGRjdGMDAiLz4KPHN0b3Agb2Zmc2V0PSIzMy4zMyUiIHN0b3AtY29sb3I9IiNGRkZGMDAiLz4KPHN0b3Agb2Zmc2V0PSI1MCUiIHN0b3AtY29sb3I9IiMwMEZGMDAiLz4KPHN0b3Agb2Zmc2V0PSI2Ni42NiUiIHN0b3AtY29sb3I9IiMwMEZGRkYiLz4KPHN0b3Agb2Zmc2V0PSI4My4zMyUiIHN0b3AtY29sb3I9IiMwMDAwRkYiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjOUIwMEZGIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0idXJsKCNyYWluYm93KSIvPgo8L3N2Zz4=',
				rdns: 'me.rainbow'
			},
			provider: {}
		}
	];
</script>

<div class="wallet-list-examples">
	<!-- Basic Example -->
	<section>
		<h3>Basic Wallet List</h3>
		<div class="example-container">
			<WalletList onWalletClick={handleWalletClick} />
			{#if selectedWallet}
				<div class="selected-info">
					Selected: {selectedWallet.type}
					{#if selectedWallet.info}
						- {selectedWallet.info.name}
					{/if}
				</div>
			{/if}
		</div>
	</section>

	<!-- With Options Control -->
	<section>
		<h3>Configurable Options</h3>
		<div class="controls">
			<label>
				<input type="checkbox" bind:checked={showCoinbase} />
				Show Coinbase Wallet
			</label>
			<label>
				<input type="checkbox" bind:checked={showWalletConnect} />
				Show WalletConnect
			</label>
		</div>
		<div class="example-container">
			<WalletList
				showCoinbaseWallet={showCoinbase}
				{showWalletConnect}
				onWalletClick={handleWalletClick}
			/>
		</div>
	</section>

	<!-- In Modal -->
	<section>
		<h3>In Modal Dialog</h3>
		<button class="open-modal-btn" onclick={() => (showModal = true)}> Connect Wallet </button>

		<Modal open={showModal} onClose={() => (showModal = false)}>
			<div class="modal-content">
				<h2>Connect Your Wallet</h2>
				<WalletList
					onWalletClick={(wallet) => {
						handleWalletClick(wallet);
						showModal = false;
					}}
				/>
			</div>
		</Modal>
	</section>

	<!-- Mock Example with Discovered Wallets -->
	<section>
		<h3>Mock Discovered Wallets (for demonstration)</h3>
		<div class="mock-container">
			<div class="wallet-section">
				<h4 class="section-title">Browser Wallets</h4>
				<div class="wallets-grid">
					{#each mockWallets as wallet (wallet.info.uuid)}
						<button
							class="wallet-button"
							onclick={() => console.log('Clicked:', wallet.info.name)}
							title={wallet.info.name}
						>
							<img src={wallet.info.icon} alt={wallet.info.name} class="wallet-icon" />
							<span class="wallet-name">{wallet.info.name}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="wallet-section">
				<h4 class="section-title">More Options</h4>
				<div class="wallets-grid">
					<button class="wallet-button">
						<div class="icon-placeholder coinbase"></div>
						<span class="wallet-name">Coinbase Wallet</span>
					</button>
					<button class="wallet-button">
						<div class="icon-placeholder walletconnect"></div>
						<span class="wallet-name">WalletConnect</span>
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- State Switching Example -->
	<section>
		<h3>State Switching (WalletList ↔ WalletConnecting)</h3>
		<p class="state-description">
			This demonstrates switching between WalletList and WalletConnecting components when a wallet
			is selected.
		</p>
		<div class="example-container">
			{#if currentView === 'list'}
				<WalletList onWalletClick={handleWalletClickWithSwitch} />
			{:else if currentView === 'connecting' && connectingWallet}
				{#if selectedWallet?.type === 'walletconnect'}
					<WalletConnecting
						walletName="WalletConnect"
						mode="walletconnect"
						walletConnectUri="wc:8a5e5bdc-a0e4-4702-ba63-8f1a5655744f@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=41791102999c339c844880b23950704cc43aa840f3739e365323cda4dfa89e7a"
						onCancel={() => {
							currentView = 'list';
							connectingWallet = null;
							selectedWallet = null;
						}}
					/>
				{:else}
					<WalletConnecting
						walletName={connectingWallet.name}
						walletIcon={connectingWallet.icon}
						onCancel={() => {
							currentView = 'list';
							connectingWallet = null;
							selectedWallet = null;
						}}
					/>
				{/if}
			{/if}
		</div>
	</section>

	<!-- WalletConnect QR Code Example -->
	<section>
		<h3>WalletConnect QR Code Display</h3>
		<p class="state-description">
			Example of WalletConnect QR code display when WalletConnect is selected.
		</p>
		<div class="example-container">
			<WalletConnecting
				walletName="WalletConnect"
				mode="walletconnect"
				walletConnectUri="wc:8a5e5bdc-a0e4-4702-ba63-8f1a5655744f@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=41791102999c339c844880b23950704cc43aa840f3739e365323cda4dfa89e7a"
				onCancel={() => console.log('Cancelled WalletConnect')}
			/>
		</div>
	</section>

	<!-- Live States Display -->
	<section>
		<h3>Live Component States</h3>
		<div class="live-states">
			<p class="state-description">
				This section shows the actual live state of wallet discovery on your system:
			</p>

			<!-- Show actual wallet list component to demonstrate real state -->
			<div class="live-state-container">
				<h4>Current State</h4>
				<WalletList
					onWalletClick={(wallet) => {
						console.log('Live state - Wallet clicked:', wallet);
					}}
				/>
			</div>

			<!-- Additional live state without Coinbase/WalletConnect -->
			<div class="live-state-container">
				<h4>Browser Wallets Only</h4>
				<WalletList
					showCoinbaseWallet={false}
					showWalletConnect={false}
					onWalletClick={(wallet) => {
						console.log('Browser only - Wallet clicked:', wallet);
					}}
				/>
			</div>
		</div>
	</section>
</div>

<style>
	.wallet-list-examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-6);
		background: var(--color-panel-1);
		border-radius: var(--radius-lg);
	}

	h3 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--font-medium);
		color: var(--color-heading-2);
	}

	h4 {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		color: var(--color-heading-2);
	}

	.example-container {
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.selected-info {
		padding: var(--space-3);
		background: var(--color-success-bg);
		color: var(--color-success);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		border-top: 1px solid var(--color-border);
	}

	.controls {
		display: flex;
		gap: var(--space-4);
		padding: var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.controls label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-foreground);
	}

	.open-modal-btn {
		align-self: flex-start;
		padding: var(--space-3) var(--space-4);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: opacity 150ms ease;
	}

	.open-modal-btn:hover {
		opacity: 0.9;
	}

	.modal-content {
		padding: var(--space-4);
	}

	.modal-content h2 {
		margin: 0 0 var(--space-4);
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
		color: var(--color-foreground);
	}

	.mock-container {
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.wallet-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.wallet-section:last-child {
		margin-bottom: 0;
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

	.wallet-icon {
		width: 48px;
		height: 48px;
		border-radius: var(--radius);
	}

	.wallet-name {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
		text-align: center;
	}

	.icon-placeholder {
		width: 48px;
		height: 48px;
		border-radius: var(--radius);
	}

	.icon-placeholder.coinbase {
		background: #0052ff;
	}

	.icon-placeholder.walletconnect {
		background: #3b99fc;
	}

	.live-states {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.state-description {
		margin: 0;
		padding: var(--space-3);
		background: var(--color-info-bg, var(--color-muted));
		color: var(--color-info, var(--color-foreground));
		border-radius: var(--radius);
		font-size: var(--text-sm);
	}

	.live-state-container {
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.live-state-container h4 {
		margin: 0 0 var(--space-3);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-muted-foreground);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
