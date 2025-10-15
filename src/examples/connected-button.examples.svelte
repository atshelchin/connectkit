<script lang="ts">
	import ConnectedButton from '../lib/components/connected-button.svelte';
	import AccountModal from '../lib/components/account-modal.svelte';
	import WalletList from '../lib/components/wallet-list.svelte';
	import WalletConnecting from '../lib/components/wallet-connecting.svelte';

	// Connection states
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let showWalletList = $state(false);
	let connectingWallet = $state<{ type: string; name: string; icon?: string } | null>(null);

	// Account info
	let address = $state('0x742d35Cc6634C0532925a3b844Bc9e7595f0fA8B');
	let balance = $state('2.457');
	let chainId = $state(1);

	// Modal states
	let showAccountModal = $state(false);

	// Auto-connect simulation
	let autoConnectTimer: ReturnType<typeof setTimeout>;

	// Wallet info interface
	interface WalletInfo {
		type: string;
		info?: {
			uuid: string;
			name: string;
			icon: string;
			rdns: string;
		};
	}

	// Handle wallet selection
	function handleWalletSelect(wallet: WalletInfo) {
		connectingWallet = {
			type: wallet.type,
			name: wallet.info?.name || (wallet.type === 'coinbase' ? 'Coinbase Wallet' : 'WalletConnect'),
			icon: wallet.info?.icon
		};
		showWalletList = false;
		isConnecting = true;

		// Simulate connection after 5 seconds
		clearTimeout(autoConnectTimer);
		autoConnectTimer = setTimeout(() => {
			isConnecting = false;
			isConnected = true;
			connectingWallet = null;
		}, 5000);
	}

	// Handle disconnect
	function handleDisconnect() {
		isConnected = false;
		showAccountModal = false;
	}

	// Start auto-connect demo
	function startAutoConnect() {
		showWalletList = true;

		// Auto-select a wallet after 2 seconds
		setTimeout(() => {
			handleWalletSelect({
				type: 'eip6963',
				info: {
					uuid: 'metamask-demo',
					name: 'MetaMask',
					icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iI0Y2ODUxQiIvPgo8cGF0aCBkPSJNMzAuNCAxMS42TDIxLjYgMTguMUwyMy4zIDE0LjFMMzAuNCAxMS42WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTkuNiAxMS42TDE4LjMgMTguMkwxNi43IDE0LjFMOS42IDExLjZaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjYuNyAyNC40TDI0LjMgMjguMkwyOS40IDI5LjZMMzAuOSAyNC41TDI2LjcgMjQuNFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik05LjEgMjQuNUwxMC42IDI5LjZMMTUuNyAyOC4yTDEzLjMgMjQuNEw5LjEgMjQuNVoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
					rdns: 'io.metamask'
				}
			});
		}, 2000);
	}

	// Width demo states
	let containerWidth1 = $state(300);
	let containerWidth2 = $state(200);
	let containerWidth3 = $state(150);
	let containerWidth4 = $state(60);
</script>

<div class="examples">
	<!-- Complete Connection Flow -->
	<section>
		<h3>Complete Connection Flow (Auto-demo)</h3>
		<p class="description">
			Click "Connect Wallet" to see the complete flow: wallet selection → connecting → connected
			state
		</p>

		<div class="flow-container">
			{#if !isConnected && !isConnecting && !showWalletList}
				<!-- Initial state - Connect button -->
				<button class="connect-wallet-btn" onclick={startAutoConnect}> Connect Wallet </button>
			{:else if showWalletList}
				<!-- Wallet selection -->
				<div class="wallet-list-container">
					<WalletList onWalletClick={handleWalletSelect} />
				</div>
			{:else if isConnecting && connectingWallet}
				<!-- Connecting state -->
				<WalletConnecting
					walletName={connectingWallet.name}
					walletIcon={connectingWallet.icon}
					mode={connectingWallet.type === 'walletconnect' ? 'walletconnect' : 'default'}
					onCancel={() => {
						isConnecting = false;
						connectingWallet = null;
						clearTimeout(autoConnectTimer);
					}}
				/>
			{:else if isConnected}
				<!-- Connected state -->
				<div class="connected-state">
					<ConnectedButton {address} {balance} onClick={() => (showAccountModal = true)} />
					<p class="hint">Click the button to open account details</p>
				</div>
			{/if}

			{#if !isConnected && (isConnecting || showWalletList)}
				<p class="auto-hint">自动演示中...</p>
			{/if}
		</div>

		<!-- Account Modal -->
		<AccountModal
			open={showAccountModal}
			onClose={() => (showAccountModal = false)}
			{address}
			{balance}
			{chainId}
			onDisconnect={handleDisconnect}
			onChainSwitch={(newChainId) => {
				chainId = newChainId;
				console.log('Switched to chain:', newChainId);
			}}
		/>
	</section>

	<!-- Responsive Width Examples -->
	<section>
		<h3>Responsive Connected Button</h3>
		<p class="description">
			The button adapts to container width, showing/hiding elements intelligently
		</p>

		<div class="width-examples">
			<!-- Full width -->
			<div class="width-example">
				<label>
					Full ({containerWidth1}px)
					<input type="range" min="240" max="400" bind:value={containerWidth1} />
				</label>
				<div class="button-container" style="width: {containerWidth1}px">
					<ConnectedButton
						address="0x742d35Cc6634C0532925a3b844Bc9e7595f0fA8B"
						balance="2.457"
						onClick={() => console.log('Clicked')}
					/>
				</div>
			</div>

			<!-- Medium width -->
			<div class="width-example">
				<label>
					Address only ({containerWidth2}px)
					<input type="range" min="160" max="240" bind:value={containerWidth2} />
				</label>
				<div class="button-container" style="width: {containerWidth2}px">
					<ConnectedButton
						address="0x742d35Cc6634C0532925a3b844Bc9e7595f0fA8B"
						balance="2.457"
						onClick={() => console.log('Clicked')}
					/>
				</div>
			</div>

			<!-- Compact width -->
			<div class="width-example">
				<label>
					Compact ({containerWidth3}px)
					<input type="range" min="80" max="160" bind:value={containerWidth3} />
				</label>
				<div class="button-container" style="width: {containerWidth3}px">
					<ConnectedButton
						address="0x742d35Cc6634C0532925a3b844Bc9e7595f0fA8B"
						balance="2.457"
						onClick={() => console.log('Clicked')}
					/>
				</div>
			</div>

			<!-- Avatar only -->
			<div class="width-example">
				<label>
					Avatar only ({containerWidth4}px)
					<input type="range" min="40" max="80" bind:value={containerWidth4} />
				</label>
				<div class="button-container" style="width: {containerWidth4}px">
					<ConnectedButton
						address="0x742d35Cc6634C0532925a3b844Bc9e7595f0fA8B"
						balance="2.457"
						onClick={() => console.log('Clicked')}
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- Account Modal Examples -->
	<section>
		<h3>Account Modal States</h3>

		<div class="modal-triggers">
			<button class="trigger-btn" onclick={() => (showAccountModal = true)}>
				Open Account Modal
			</button>
		</div>
	</section>

	<!-- Different Addresses -->
	<section>
		<h3>Different Account States</h3>

		<div class="account-examples">
			<div class="account-example">
				<span class="label">With ENS (mainnet):</span>
				<ConnectedButton
					address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
					balance="123.45"
					onClick={() => console.log('Vitalik')}
				/>
			</div>

			<div class="account-example">
				<span class="label">Regular address:</span>
				<ConnectedButton
					address="0x742d35Cc6634C0532925a3b844Bc9e7595f0fA8B"
					balance="0.025"
					onClick={() => console.log('Regular')}
				/>
			</div>

			<div class="account-example">
				<span class="label">No balance:</span>
				<ConnectedButton
					address="0x0000000000000000000000000000000000000001"
					showBalance={false}
					onClick={() => console.log('No balance')}
				/>
			</div>
		</div>
	</section>
</div>

<style>
	.examples {
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

	.description {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.flow-container {
		min-height: 400px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-8);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		position: relative;
	}

	.connect-wallet-btn {
		padding: var(--space-3) var(--space-6);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-base);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.connect-wallet-btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.wallet-list-container {
		width: 100%;
		max-width: 600px;
	}

	.connected-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.hint,
	.auto-hint {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.auto-hint {
		position: absolute;
		bottom: var(--space-4);
		font-style: italic;
	}

	.width-examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.width-example {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.width-example label {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-foreground);
	}

	.width-example input[type='range'] {
		flex: 1;
		max-width: 200px;
	}

	.button-container {
		padding: var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60px;
	}

	.modal-triggers {
		display: flex;
		gap: var(--space-3);
	}

	.trigger-btn {
		padding: var(--space-2) var(--space-4);
		background: var(--color-muted);
		color: var(--color-foreground);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.trigger-btn:hover {
		background: var(--color-muted-hover, var(--color-border));
		transform: translateY(-1px);
	}

	.account-examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.account-example {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.account-example .label {
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
		min-width: 140px;
	}
</style>
