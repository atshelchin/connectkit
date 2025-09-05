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
 * Svelte 5 Runes-based wallet store
 */
class WalletStoreImpl {
	// State using $state rune
	private connectionState = $state<ConnectionState>({
		isConnected: false,
		isConnecting: false
	});

	private availableConnectors = $state<Connector[]>([]);
	private eip6963WalletsList = $state<EIP6963ProviderDetail[]>([]);

	// Derived state using $derived rune for better performance and reactivity
	state = $derived(this.connectionState);
	isConnected = $derived(this.connectionState.isConnected);
	isConnecting = $derived(this.connectionState.isConnecting);
	address = $derived(this.connectionState.address);
	addresses = $derived(this.connectionState.addresses);
	chainId = $derived(this.connectionState.chainId);
	connectors = $derived(this.availableConnectors);
	eip6963Wallets = $derived(this.eip6963WalletsList);

	// Manager instance
	private manager: WalletConnectionManager | null = null;
	private unsubscribe: (() => void) | null = null;
	private unwatchEIP6963: (() => void) | null = null;

	constructor(connectors: Connector[] = []) {
		this.initialize(connectors);
	}

	private initialize(connectors: Connector[]) {
		// Create manager if not exists
		if (!this.manager) {
			this.manager = new WalletConnectionManager(connectors);

			// Subscribe to manager state changes
			this.unsubscribe = this.manager.subscribe((state) => {
				this.connectionState = state;
			});

			// Set initial connectors
			this.availableConnectors = this.manager.getConnectors();

			// Watch for EIP6963 wallets
			this.unwatchEIP6963 = watchEIP6963Wallets((wallets) => {
				this.eip6963WalletsList = wallets;
			});
		} else {
			// Add new connectors to existing manager
			connectors.forEach((connector) => {
				this.manager!.registerConnector(connector);
			});
			this.availableConnectors = this.manager.getConnectors();
		}
	}

	// Actions
	async connect(connector: Connector, chainId?: number): Promise<void> {
		if (!this.manager) throw new Error('Store not initialized');
		await this.manager.connect(connector, chainId);
	}

	async disconnect(): Promise<void> {
		if (!this.manager) throw new Error('Store not initialized');
		await this.manager.disconnect();
	}

	async switchChain(chainId: number): Promise<void> {
		if (!this.manager) throw new Error('Store not initialized');
		await this.manager.switchChain(chainId);
	}

	async switchAccount(address: string): Promise<void> {
		if (!this.manager) throw new Error('Store not initialized');
		await this.manager.switchAccount(address as `0x${string}`);
	}

	async signMessage(message: string): Promise<string> {
		if (!this.manager) throw new Error('Store not initialized');
		return await this.manager.signMessage(message);
	}

	async autoConnect(): Promise<boolean> {
		if (!this.manager) throw new Error('Store not initialized');
		return await this.manager.autoConnect();
	}

	registerConnector(connector: Connector): void {
		if (!this.manager) throw new Error('Store not initialized');
		this.manager.registerConnector(connector);
		this.availableConnectors = this.manager.getConnectors();
	}

	// Cleanup method
	destroy(): void {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
		if (this.unwatchEIP6963) {
			this.unwatchEIP6963();
			this.unwatchEIP6963 = null;
		}
	}
}

/**
 * Subscribable interface for backward compatibility
 */
interface Subscribable<T> {
	subscribe: (fn: (value: T) => void) => () => void;
}

/**
 * Legacy interface for backward compatibility
 */
export interface WalletStore {
	// Connection state with subscribe support
	readonly state: ConnectionState & Subscribable<ConnectionState>;
	readonly isConnected: boolean & Subscribable<boolean>;
	readonly isConnecting: boolean & Subscribable<boolean>;
	readonly address: (string | undefined) & Subscribable<string | undefined>;
	readonly addresses: (string[] | undefined) & Subscribable<string[] | undefined>;
	readonly chainId: (number | undefined) & Subscribable<number | undefined>;

	// Available connectors with subscribe support
	readonly connectors: Connector[] & Subscribable<Connector[]>;
	readonly eip6963Wallets: EIP6963ProviderDetail[] & Subscribable<EIP6963ProviderDetail[]>;

	// Actions
	connect: (connector: Connector, chainId?: number) => Promise<void>;
	disconnect: () => Promise<void>;
	switchChain: (chainId: number) => Promise<void>;
	switchAccount: (address: string) => Promise<void>;
	signMessage: (message: string) => Promise<string>;
	autoConnect: () => Promise<boolean>;
	registerConnector: (connector: Connector) => void;
}

// Global store instance
let globalStore: WalletStoreImpl | null = null;

/**
 * Helper to create a subscribable wrapper for a value
 */
function makeSubscribable<T>(getValue: () => T): T & Subscribable<T> {
	const subscribable = {
		subscribe(fn: (value: T) => void) {
			let cleanup: (() => void) | null = null;

			if (typeof window !== 'undefined') {
				cleanup = $effect.root(() => {
					$effect(() => {
						const value = getValue();
						fn(value);
					});
				});

				// Initial call
				fn(getValue());
			}

			return () => {
				if (cleanup) cleanup();
			};
		}
	};

	// Create a proxy that returns the value for property access
	// and the subscribe method when needed
	return new Proxy(subscribable as T & Subscribable<T>, {
		get(target, prop) {
			if (prop === 'subscribe') {
				return target.subscribe;
			}
			// For all other properties, get them from the actual value
			const value = getValue();
			if (value != null && typeof value === 'object') {
				return (value as Record<string, unknown>)[prop as string];
			}
			// For primitives, convert to object first
			if (prop === 'valueOf' || prop === Symbol.toPrimitive || prop === Symbol.toStringTag) {
				return () => value;
			}
			if (prop === 'toString') {
				return () => String(value);
			}
			// Return undefined for other properties on primitives
			return undefined;
		},
		// Handle primitive conversions
		has(target, prop) {
			if (prop === 'subscribe') return true;
			const value = getValue();
			if (value != null && typeof value === 'object') {
				return prop in value;
			}
			return false;
		},
		ownKeys() {
			const value = getValue();
			if (value != null && typeof value === 'object') {
				return [...Object.keys(value), 'subscribe'];
			}
			return ['subscribe'];
		},
		getOwnPropertyDescriptor(target, prop) {
			if (prop === 'subscribe') {
				return { configurable: true, enumerable: false, value: target.subscribe };
			}
			const value = getValue();
			if (value != null && typeof value === 'object') {
				return Object.getOwnPropertyDescriptor(value, prop);
			}
			return undefined;
		}
	});
}

/**
 * Initialize the wallet connection store
 */
export function initializeWalletStore(connectors: Connector[] = []): WalletStore {
	if (!globalStore) {
		globalStore = new WalletStoreImpl(connectors);
	} else {
		// Add new connectors to existing store
		connectors.forEach((connector) => {
			globalStore!.registerConnector(connector);
		});
	}

	// Create a store wrapper that provides subscribe methods for backward compatibility
	const store = globalStore;

	return {
		// State properties with subscribe support
		get state() {
			return makeSubscribable(() => store.state);
		},
		get isConnected() {
			return makeSubscribable(() => store.isConnected);
		},
		get isConnecting() {
			return makeSubscribable(() => store.isConnecting);
		},
		get address() {
			return makeSubscribable(() => store.address);
		},
		get addresses() {
			return makeSubscribable(() => store.addresses);
		},
		get chainId() {
			return makeSubscribable(() => store.chainId);
		},

		// Connectors with subscribe support
		get connectors() {
			return makeSubscribable(() => store.connectors);
		},
		get eip6963Wallets() {
			return makeSubscribable(() => store.eip6963Wallets);
		},

		// Actions (pass through directly)
		connect: store.connect.bind(store),
		disconnect: store.disconnect.bind(store),
		switchChain: store.switchChain.bind(store),
		switchAccount: store.switchAccount.bind(store),
		signMessage: store.signMessage.bind(store),
		autoConnect: store.autoConnect.bind(store),
		registerConnector: store.registerConnector.bind(store)
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
 * Export simple getters for components that only need to read state
 * These are reactive when used in Svelte 5 components
 */
export function getConnectionState(): ConnectionState {
	if (!globalStore) {
		return { isConnected: false, isConnecting: false };
	}
	return globalStore.state;
}

export function getIsConnected(): boolean {
	if (!globalStore) return false;
	return globalStore.isConnected;
}

export function getIsConnecting(): boolean {
	if (!globalStore) return false;
	return globalStore.isConnecting;
}

export function getAddress(): string | undefined {
	if (!globalStore) return undefined;
	return globalStore.address;
}

export function getChainId(): number | undefined {
	if (!globalStore) return undefined;
	return globalStore.chainId;
}

// Legacy exports for backward compatibility
export const connectionState$ = {
	subscribe(fn: (value: ConnectionState) => void) {
		// Create a reactive effect that runs when state changes
		let cleanup: (() => void) | null = null;

		if (typeof window !== 'undefined') {
			cleanup = $effect.root(() => {
				$effect(() => {
					const state = getConnectionState();
					fn(state);
				});
			});

			// Initial call
			fn(getConnectionState());
		}

		// Return unsubscribe function
		return () => {
			if (cleanup) cleanup();
		};
	}
};

export const isConnected$ = {
	subscribe(fn: (value: boolean) => void) {
		let cleanup: (() => void) | null = null;

		if (typeof window !== 'undefined') {
			cleanup = $effect.root(() => {
				$effect(() => {
					const isConnected = getIsConnected();
					fn(isConnected);
				});
			});

			// Initial call
			fn(getIsConnected());
		}

		return () => {
			if (cleanup) cleanup();
		};
	}
};

export const isConnecting$ = {
	subscribe(fn: (value: boolean) => void) {
		let cleanup: (() => void) | null = null;

		if (typeof window !== 'undefined') {
			cleanup = $effect.root(() => {
				$effect(() => {
					const isConnecting = getIsConnecting();
					fn(isConnecting);
				});
			});

			// Initial call
			fn(getIsConnecting());
		}

		return () => {
			if (cleanup) cleanup();
		};
	}
};

export const address$ = {
	subscribe(fn: (value: string | undefined) => void) {
		let cleanup: (() => void) | null = null;

		if (typeof window !== 'undefined') {
			cleanup = $effect.root(() => {
				$effect(() => {
					const address = getAddress();
					fn(address);
				});
			});

			// Initial call
			fn(getAddress());
		}

		return () => {
			if (cleanup) cleanup();
		};
	}
};

export const chainId$ = {
	subscribe(fn: (value: number | undefined) => void) {
		let cleanup: (() => void) | null = null;

		if (typeof window !== 'undefined') {
			cleanup = $effect.root(() => {
				$effect(() => {
					const chainId = getChainId();
					fn(chainId);
				});
			});

			// Initial call
			fn(getChainId());
		}

		return () => {
			if (cleanup) cleanup();
		};
	}
};
