<script lang="ts">
	import WalletList from './wallet-list.svelte';
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

	// Handle wallet click
	function handleWalletClick(wallet: WalletInfo) {
		selectedWallet = wallet;
		console.log('Wallet clicked:', wallet);
	}

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

	.icon-placeholder.metamask {
		background: #f6851b;
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

	.discovering {
		display: flex;
		align-items: center;
		gap: var(--space-3);
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
		gap: var(--space-2);
		text-align: center;
	}

	.no-wallets p {
		margin: 0;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
	}

	.hint {
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
	}
</style>
