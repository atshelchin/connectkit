import { writable, derived, type Readable } from 'svelte/store';
import { WalletConnectionManager } from './manager.js';
import { watchEIP6963Wallets } from './eip6963.js';
import type {
	ConnectionState,
	Connector,
	EIP6963ProviderDetail,
	EIP6963ConnectorOptions,
	CoinbaseConnectorOptions,
	WalletConnectConnectorOptions
} from './types.js';

/**
 * Svelte Store for wallet connection management
 */
export interface WalletStore {
	// Connection state
	state: Readable<ConnectionState>;
	isConnected: Readable<boolean>;
	isConnecting: Readable<boolean>;
	address: Readable<string | undefined>;
	chainId: Readable<number | undefined>;

	// Available connectors
	connectors: Readable<Connector[]>;
	eip6963Wallets: Readable<EIP6963ProviderDetail[]>;

	// Actions
	connect: (connector: Connector, chainId?: number) => Promise<void>;
	disconnect: () => Promise<void>;
	switchChain: (chainId: number) => Promise<void>;
	autoConnect: () => Promise<boolean>;
	registerConnector: (connector: Connector) => void;
}

// Internal stores
const connectionState = writable<ConnectionState>({
	isConnected: false,
	isConnecting: false
});

const availableConnectors = writable<Connector[]>([]);
const eip6963Wallets = writable<EIP6963ProviderDetail[]>([]);

// Manager instance
let manager: WalletConnectionManager | null = null;

/**
 * Initialize the wallet connection store
 */
export function initializeWalletStore(connectors: Connector[] = []): WalletStore {
	// Create manager if not exists
	if (!manager) {
		manager = new WalletConnectionManager(connectors);

		// Subscribe to manager state changes
		manager.subscribe((state) => {
			connectionState.set(state);
		});

		// Set initial connectors
		availableConnectors.set(manager.getConnectors());

		// Watch for EIP6963 wallets
		watchEIP6963Wallets((wallets) => {
			eip6963Wallets.set(wallets);
		});

		// Don't auto-connect here - let config.ts handle it after wallet discovery
		// This prevents attempting to connect before EIP6963 wallets are discovered
	} else {
		// Add new connectors to existing manager
		connectors.forEach((connector) => {
			manager!.registerConnector(connector);
		});
		availableConnectors.set(manager.getConnectors());
	}

	// Create derived stores
	const isConnected = derived(connectionState, ($state) => $state.isConnected);

	const isConnecting = derived(connectionState, ($state) => $state.isConnecting);

	const address = derived(connectionState, ($state) => $state.address);

	const chainId = derived(connectionState, ($state) => $state.chainId);

	return {
		// State
		state: connectionState,
		isConnected,
		isConnecting,
		address,
		chainId,

		// Connectors
		connectors: availableConnectors,
		eip6963Wallets,

		// Actions
		connect: async (connector: Connector, chainId?: number) => {
			if (!manager) throw new Error('Store not initialized');
			await manager.connect(connector, chainId);
		},

		disconnect: async () => {
			if (!manager) throw new Error('Store not initialized');
			await manager.disconnect();
		},

		switchChain: async (chainId: number) => {
			if (!manager) throw new Error('Store not initialized');
			await manager.switchChain(chainId);
		},

		autoConnect: async () => {
			if (!manager) throw new Error('Store not initialized');
			return await manager.autoConnect();
		},

		registerConnector: (connector: Connector) => {
			if (!manager) throw new Error('Store not initialized');
			manager.registerConnector(connector);
			availableConnectors.set(manager.getConnectors());
		}
	};
}

// Default store instance
export const walletStore = initializeWalletStore();

/**
 * Helper function to create EIP6963 connectors dynamically
 */
export function createEIP6963Connector(
	providerDetail: EIP6963ProviderDetail,
	options?: Partial<EIP6963ConnectorOptions>
) {
	// Dynamically import to avoid circular dependency
	return import('./eip6963.js').then(({ EIP6963Connector }) => {
		return new EIP6963Connector({
			providerDetail,
			...options
		});
	});
}

/**
 * Helper function to create Coinbase connector
 */
export function createCoinbaseConnector(options?: Partial<CoinbaseConnectorOptions>) {
	return import('./coinbase-smart-wallet.js').then(({ CoinbaseConnector }) => {
		return new CoinbaseConnector({
			appName: 'ConnectKit',
			preference: 'smartWalletOnly',
			...options
		});
	});
}

/**
 * Helper function to create WalletConnect connector
 */
export function createWalletConnectConnector(
	projectId: string,
	options?: Partial<WalletConnectConnectorOptions>
) {
	return import('./walletconnect.js').then(({ WalletConnectConnector }) => {
		return new WalletConnectConnector({
			projectId,
			showQrModal: true,
			...options
		});
	});
}

/**
 * Export connection state as a simple readable store
 * for components that only need to read the state
 */
export const connectionState$ = connectionState as Readable<ConnectionState>;
export const isConnected$ = derived(connectionState, ($state) => $state.isConnected);
export const isConnecting$ = derived(connectionState, ($state) => $state.isConnecting);
export const address$ = derived(connectionState, ($state) => $state.address);
export const chainId$ = derived(connectionState, ($state) => $state.chainId);
