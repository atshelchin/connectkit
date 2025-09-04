<script lang="ts">
	import { onMount } from 'svelte';
	import { configureConnectKit, type WalletStore, type Connector } from '../connectors/index.js';
	import ConnectedButton from './connected-button.svelte';
	import AccountModal from './account-modal.svelte';
	import WalletList from './wallet-list.svelte';
	import WalletConnecting from './wallet-connecting.svelte';
	import { mainnet, polygon, optimism, arbitrum, base } from 'viem/chains';

	// State from the wallet store
	let store: WalletStore;
	let isConnected = $state(false);
	let isConnecting = $state(false);
	let address = $state<string | undefined>(undefined);
	let addresses = $state<string[] | undefined>(undefined);
	let chainId = $state<number | undefined>(undefined);
	let connectors = $state<Connector[]>([]);
	interface EIP6963WalletInfo {
		info: {
			uuid: string;
			name: string;
			icon: string;
			rdns: string;
		};
		provider: unknown;
	}

	let eip6963Wallets = $state<EIP6963WalletInfo[]>([]);

	// UI state
	let showWalletList = $state(false);
	let showAccountModal = $state(false);
	let connectingWallet = $state<{ name: string; icon?: string } | null>(null);
	let selectedConnector = $state<Connector | null>(null);
	let walletConnectUri = $state<string | undefined>(undefined);
	let errorMessage = $state<string | undefined>(undefined);

	// Initialize the connector system
	onMount(async () => {
		const result = await configureConnectKit({
			// Replace with your WalletConnect project ID
			// This is a test project ID - replace with your own for production
			walletConnectProjectId: '2c921904d8ebc91517cd11c1cc4a267f',
			appName: 'ConnectKit Demo',
			appDescription: 'A demo of the ConnectKit connector system',
			chains: [mainnet, polygon, optimism, arbitrum, base],
			enabledConnectors: ['eip6963', 'coinbase', 'walletconnect'],
			coinbasePreference: 'smartWalletOnly',
			autoConnect: true
		});

		store = result.store;
		connectors = result.connectors;

		// Subscribe to store changes
		const unsubscribeState = store.state.subscribe((state) => {
			isConnected = state.isConnected;
			isConnecting = state.isConnecting;
			address = state.address;
			addresses = state.addresses;
			chainId = state.chainId;
		});

		const unsubscribeConnectors = store.connectors.subscribe((c) => {
			connectors = c;
		});

		const unsubscribeEIP6963 = store.eip6963Wallets.subscribe((w) => {
			eip6963Wallets = w;
		});

		return () => {
			unsubscribeState();
			unsubscribeConnectors();
			unsubscribeEIP6963();
		};
	});

	// Handle wallet selection from list
	interface WalletSelection {
		type: string;
		info?: {
			uuid: string;
			name: string;
			icon: string;
			rdns: string;
		};
	}

	async function handleWalletSelect(wallet: WalletSelection) {
		showWalletList = false;

		// Handle different wallet types
		if (wallet.type === 'eip6963' && wallet.info) {
			// Find existing connector or create new one for EIP6963 wallet
			let connector = connectors.find((c) => c.id === `eip6963:${wallet.info.rdns}`);

			if (!connector) {
				// Find the actual EIP6963 wallet detail from the store
				const walletDetail = eip6963Wallets.find((w) => w.info.rdns === wallet.info.rdns);

				if (walletDetail) {
					// Dynamically import and create the connector
					const { EIP6963Connector } = await import('../connectors/eip6963.js');
					connector = new EIP6963Connector({
						providerDetail: walletDetail,
						chains: [mainnet, polygon, optimism, arbitrum, base]
					});

					// Register the new connector with the store
					if (store) {
						store.registerConnector(connector);
					}
				}
			}

			if (connector) {
				selectedConnector = connector;
				connectingWallet = {
					name: wallet.info.name,
					icon: wallet.info.icon
				};
				await handleConnect(connector);
			}
		} else if (wallet.type === 'coinbase') {
			// Find Coinbase connector

			const connector = connectors.find((c) => c.id === 'coinbase');
			console.log(1, 'coinbase', connector, connectors);
			if (connector) {
				selectedConnector = connector;
				connectingWallet = {
					name: 'Coinbase Wallet',
					icon: connector.icon
				};
				await handleConnect(connector);
			}
		} else if (wallet.type === 'walletconnect') {
			// Find WalletConnect connector
			const connector = connectors.find((c) => c.id === 'walletconnect');
			if (connector) {
				selectedConnector = connector;
				connectingWallet = {
					name: 'WalletConnect',
					icon: connector.icon
				};
				await handleConnect(connector);
			}
		}
	}

	// Connect with a specific connector
	async function handleConnect(connector: Connector) {
		try {
			// Reset error state
			errorMessage = undefined;

			// Listen for WalletConnect URI if it's a WalletConnect connector
			if (connector.id === 'walletconnect') {
				console.log('Setting up WalletConnect URI listener');
				walletConnectUri = undefined;
				connector.on('display_uri', (uri: string) => {
					console.log('Received WalletConnect URI:', uri);
					walletConnectUri = uri;
				});
			}

			await store.connect(connector);
			// Success - clear all states
			connectingWallet = null;
			selectedConnector = null;
			walletConnectUri = undefined;
			errorMessage = undefined;
		} catch (error) {
			console.error('Connection failed:', error);

			// Parse error
			const err = error as Error & { code?: number };
			let message = '连接失败，请重试';

			if (err.code === -32002 || err.message?.includes('already pending')) {
				// Request already pending - guide user to check their wallet
				message = '请检查您的钱包扩展，可能有待确认的连接请求';
			} else if (err.code === 4001 || err.message?.includes('rejected')) {
				// User rejected
				message = '连接已被拒绝';
			} else if (err.message) {
				message = err.message;
			}

			errorMessage = message;

			// Keep the connecting UI open so user can see the error and retry
			// Don't clear connectingWallet and selectedConnector
		}
	}

	// Handle disconnect
	async function handleDisconnect() {
		await store.disconnect();
		showAccountModal = false;
	}

	// Handle chain switch
	async function handleChainSwitch(newChainId: number) {
		try {
			await store.switchChain(newChainId);
		} catch (error) {
			console.error('Failed to switch chain:', error);
		}
	}

	// Cancel connection
	function handleCancelConnection() {
		connectingWallet = null;
		selectedConnector = null;
		walletConnectUri = undefined;
		errorMessage = undefined;
		// Connection will be cancelled automatically
	}

	// Retry connection
	function handleRetry() {
		if (selectedConnector) {
			handleConnect(selectedConnector);
		}
	}
</script>

<div class="connector-demo">
	<h2>连接器系统演示</h2>
	<p class="description">
		这是一个完整的钱包连接系统演示，支持 EIP6963、Coinbase Smart Wallet 和 WalletConnect
	</p>

	<div class="demo-container">
		{#if !isConnected && !isConnecting && !showWalletList}
			<!-- Initial state - Connect button -->
			<button class="connect-btn" onclick={() => (showWalletList = true)}> 连接钱包 </button>
		{:else if showWalletList && !isConnecting}
			<!-- Wallet selection -->
			<div class="wallet-list-container">
				<div class="list-header">
					<h3>选择钱包</h3>
					<button class="close-btn" onclick={() => (showWalletList = false)}> ✕ </button>
				</div>
				<WalletList onWalletClick={handleWalletSelect} />
			</div>
		{:else if isConnecting && connectingWallet}
			<!-- Connecting state -->
			<WalletConnecting
				walletName={connectingWallet.name}
				walletIcon={connectingWallet.icon}
				mode={selectedConnector?.id === 'walletconnect' ? 'walletconnect' : 'default'}
				{walletConnectUri}
				{errorMessage}
				onCancel={handleCancelConnection}
				onRetry={handleRetry}
			/>
		{:else if isConnected && address}
			<!-- Connected state -->
			<div class="connected-state">
				<ConnectedButton {address} balance="0.0" onClick={() => (showAccountModal = true)} />
				<p class="status">
					已连接到链 ID: {chainId}
				</p>
			</div>
		{/if}

		<!-- Account Modal -->
		<AccountModal
			open={showAccountModal}
			onClose={() => (showAccountModal = false)}
			address={address || ''}
			{addresses}
			balance="0.0"
			{chainId}
			onDisconnect={handleDisconnect}
			onChainSwitch={handleChainSwitch}
			onAccountSwitch={async (addr) => {
				if (store) {
					await store.switchAccount(addr);
				}
			}}
			onSignMessage={async (message) => {
				if (store) {
					return await store.signMessage(message);
				}
				throw new Error('Store not initialized');
			}}
		/>
	</div>

	<div class="info-section">
		<h3>功能特点：</h3>
		<ul>
			<li>✅ 支持 EIP6963 自动发现钱包</li>
			<li>✅ 支持 Coinbase Smart Wallet</li>
			<li>✅ 支持 WalletConnect</li>
			<li>✅ 连接状态持久化到 localStorage</li>
			<li>✅ 自动重连</li>
			<li>✅ 多链支持与切换</li>
			<li>✅ 类型安全</li>
			<li>✅ 模块化架构，易于扩展</li>
		</ul>
	</div>

	<div class="code-section">
		<h3>使用方法：</h3>
		<pre><code
				>{`import { configureConnectKit } from '$lib/connectors';

// 初始化连接系统
const { store, connectors } = await configureConnectKit({
  walletConnectProjectId: 'YOUR_PROJECT_ID',
  appName: 'Your App',
  chains: [mainnet, polygon, optimism],
  enabledConnectors: ['eip6963', 'coinbase', 'walletconnect'],
  autoConnect: true
});

// 在组件中使用
const { isConnected, address, connect, disconnect } = store;`}</code
			></pre>
	</div>
</div>

<style>
	.connector-demo {
		padding: var(--space-6);
		max-width: 800px;
		margin: 0 auto;
	}

	h2 {
		font-size: var(--text-2xl);
		font-weight: var(--font-semibold);
		margin-bottom: var(--space-2);
	}

	.description {
		color: var(--color-muted-foreground);
		margin-bottom: var(--space-6);
	}

	.demo-container {
		min-height: 400px;
		padding: var(--space-8);
		background: var(--color-panel-1);
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--space-8);
		position: relative;
	}

	.connect-btn {
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

	.connect-btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.wallet-list-container {
		width: 100%;
		max-width: 400px;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.list-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4);
		border-bottom: 1px solid var(--color-border);
	}

	.list-header h3 {
		margin: 0;
		font-size: var(--text-lg);
	}

	.close-btn {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		color: var(--color-muted-foreground);
		cursor: pointer;
		border-radius: var(--radius);
		transition: all 150ms ease;
	}

	.close-btn:hover {
		background: var(--color-muted);
	}

	.connected-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.status {
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.info-section {
		background: var(--color-panel-1);
		padding: var(--space-6);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-6);
	}

	.info-section h3 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		font-weight: var(--font-medium);
	}

	.info-section ul {
		margin: 0;
		padding-left: var(--space-6);
		line-height: 1.8;
	}

	.code-section {
		background: var(--color-panel-1);
		padding: var(--space-6);
		border-radius: var(--radius-lg);
	}

	.code-section h3 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		font-weight: var(--font-medium);
	}

	pre {
		background: var(--color-background);
		padding: var(--space-4);
		border-radius: var(--radius);
		overflow-x: auto;
		border: 1px solid var(--color-border);
	}

	code {
		font-family: 'Monaco', 'Courier New', monospace;
		font-size: var(--text-sm);
		line-height: 1.6;
	}
</style>
