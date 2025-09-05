/**
 * ConnectKit Connector System
 *
 * A modular wallet connection system supporting multiple connection methods:
 * - EIP6963 (auto-discovered wallets)
 * - Coinbase Smart Wallet
 * - WalletConnect
 * - Custom injected wallets
 */

// Export types
export type {
	Connector,
	ConnectorMetadata,
	ConnectorEvents,
	ConnectorOptions,
	ConnectionState,
	ConnectionManager,
	PersistedConnection,
	EIP6963ProviderDetail,
	EIP6963ConnectorOptions,
	WalletConnectConnectorOptions,
	CoinbaseConnectorOptions,
	InjectedConnectorOptions
} from './types.js';

export { ConnectorType } from './types.js';
export type { WalletStore } from './store.js';

// Export base classes
export { BaseConnector } from './base.js';

// Export connectors
export { EIP6963Connector, watchEIP6963Wallets } from './eip6963.js';
export { CoinbaseConnector } from './coinbase-smart-wallet.js';
export { WalletConnectConnector } from './walletconnect.js';

// Export manager
export { WalletConnectionManager } from './manager.js';

// Export store and helpers
export {
	walletStore,
	initializeWalletStore,
	createEIP6963Connector,
	createCoinbaseConnector,
	createWalletConnectConnector,
	connectionState$,
	isConnected$,
	isConnecting$,
	address$,
	chainId$
} from './store.svelte.js';

// Export configuration helper
export { configureConnectKit, getChainById, formatChainName } from './config.js';
export type { ConnectKitConfig } from './config.js';

/**
 * Quick start example:
 *
 * ```typescript
 * import { configureConnectKit } from '$lib/connectors';
 *
 * // Initialize with your configuration
 * const { store, connectors } = await configureConnectKit({
 *   walletConnectProjectId: 'your-project-id',
 *   appName: 'Your App Name',
 *   chains: [mainnet, polygon, optimism],
 *   enabledConnectors: ['eip6963', 'coinbase', 'walletconnect']
 * });
 *
 * // Use in your Svelte components
 * const { isConnected, address, connect, disconnect } = store;
 * ```
 */
