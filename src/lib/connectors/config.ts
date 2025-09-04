import type { Chain } from 'viem';
import { mainnet, polygon, optimism, arbitrum, base, bsc } from 'viem/chains';
import {
	initializeWalletStore,
	createEIP6963Connector,
	createCoinbaseConnector,
	createWalletConnectConnector
} from './store.js';
import { watchEIP6963Wallets } from './eip6963.js';
import type { Connector, WalletStore } from './types.js';

/**
 * Configuration options for ConnectKit
 */
export interface ConnectKitConfig {
	// Project ID for WalletConnect
	walletConnectProjectId?: string;

	// App metadata
	appName?: string;
	appDescription?: string;
	appUrl?: string;
	appIcon?: string;

	// Chains configuration
	chains?: Chain[];

	// Enabled connector types
	enabledConnectors?: Array<'eip6963' | 'coinbase' | 'walletconnect' | 'injected'>;

	// Coinbase Wallet options
	coinbasePreference?: 'smartWalletOnly' | 'all';

	// WalletConnect options
	walletConnectShowQrModal?: boolean;

	// Auto-connect on initialization
	autoConnect?: boolean;
}

// Default chains
const defaultChains = [mainnet, polygon, optimism, arbitrum, base, bsc];

/**
 * Configure and initialize ConnectKit
 */
export async function configureConnectKit(config: ConnectKitConfig = {}): Promise<{
	store: WalletStore;
	connectors: Connector[];
}> {
	const {
		walletConnectProjectId,
		appName = 'ConnectKit App',
		appDescription = 'Connect your wallet',
		appUrl = typeof window !== 'undefined' ? window.location.origin : '',
		appIcon,
		chains = defaultChains,
		enabledConnectors = ['eip6963', 'coinbase', 'walletconnect'],
		coinbasePreference = 'smartWalletOnly',
		walletConnectShowQrModal = true,
		autoConnect = true
	} = config;

	const connectors: Connector[] = [];
	const connectorPromises: Promise<Connector | Connector[]>[] = [];

	// Create Coinbase connector if enabled
	if (enabledConnectors.includes('coinbase')) {
		connectorPromises.push(
			createCoinbaseConnector({
				appName,
				appLogoUrl: appIcon,
				preference: coinbasePreference,
				chains
			})
		);
	}

	// Create WalletConnect connector if enabled and project ID provided
	if (enabledConnectors.includes('walletconnect') && walletConnectProjectId) {
		connectorPromises.push(
			createWalletConnectConnector(walletConnectProjectId, {
				chains,
				showQrModal: walletConnectShowQrModal,
				metadata: {
					name: appName,
					description: appDescription,
					url: appUrl,
					icons: appIcon ? [appIcon] : []
				}
			})
		);
	}

	// Watch for EIP6963 wallets if enabled
	if (enabledConnectors.includes('eip6963')) {
		const eip6963Promise = new Promise<Connector[]>((resolve) => {
			let resolved = false;

			// Watch for EIP6963 wallets
			const unwatch = watchEIP6963Wallets(async (wallets) => {
				if (resolved) return;

				// Create connectors for discovered wallets
				const eip6963Connectors = await Promise.all(
					wallets.map((wallet) => createEIP6963Connector(wallet, { chains }))
				);

				resolve(eip6963Connectors);
				resolved = true;

				// Clean up after first discovery
				setTimeout(() => unwatch(), 100);
			});

			// Resolve with empty array if no wallets found after timeout
			setTimeout(() => {
				if (!resolved) {
					resolve([]);
					resolved = true;
					unwatch();
				}
			}, 1000);
		});

		connectorPromises.push(eip6963Promise);
	}

	// Wait for all connectors to be created
	const resolvedConnectors = await Promise.all(connectorPromises);

	// Flatten the array (EIP6963 returns an array)
	resolvedConnectors.forEach((connector) => {
		if (Array.isArray(connector)) {
			connectors.push(...connector);
		} else {
			connectors.push(connector);
		}
	});

	// Initialize the store with connectors
	const store = initializeWalletStore(connectors);

	// Flag to track if we need to handle EIP6963 persistence
	let eip6963HandledElsewhere = false;

	// Check for persisted EIP6963 connection and wait for wallet discovery
	if (enabledConnectors.includes('eip6963') && typeof window !== 'undefined') {
		try {
			const persistedData = localStorage.getItem('connectkit.connection');
			console.log('[ConnectKit] Checking for persisted connection:', persistedData);
			if (persistedData) {
				const persisted = JSON.parse(persistedData);
				console.log('[ConnectKit] Persisted connection found:', persisted);
				if (persisted.connectorId?.startsWith('eip6963:') && persisted.eip6963Info) {
					eip6963HandledElsewhere = true;
					console.log('[ConnectKit] EIP6963 wallet needs restoration:', persisted.eip6963Info);
					// Wait for EIP6963 wallet discovery
					await new Promise<void>((resolve) => {
						let resolved = false;
						const unwatch = watchEIP6963Wallets(async (wallets) => {
							console.log(
								'[ConnectKit] EIP6963 wallets discovered:',
								wallets.map((w) => w.info.rdns)
							);
							const targetWallet = wallets.find((w) => w.info.rdns === persisted.eip6963Info.rdns);
							if (targetWallet && !resolved) {
								console.log(
									'[ConnectKit] Found target wallet, creating connector:',
									targetWallet.info.rdns
								);
								// Create the EIP6963 connector for the persisted wallet
								const connector = await createEIP6963Connector(targetWallet, { chains });
								store.registerConnector(connector);
								resolved = true;

								// Now attempt auto-connect with the newly created connector
								if (autoConnect) {
									console.log('[ConnectKit] Attempting auto-connect with EIP6963 wallet');
									await store.autoConnect();
								}

								setTimeout(() => unwatch(), 100);
								resolve();
							}
						});

						// Timeout after 3 seconds (give more time for wallet discovery)
						setTimeout(async () => {
							if (!resolved) {
								console.log('[ConnectKit] Timeout waiting for EIP6963 wallet discovery');
								resolved = true;
								unwatch();
								// Still try autoConnect in case other wallets are available
								if (autoConnect) {
									console.log('[ConnectKit] Attempting fallback auto-connect');
									await store.autoConnect();
								}
								resolve();
							}
						}, 3000);
					});
				}
			}
		} catch (error) {
			console.warn('Failed to restore EIP6963 connection:', error);
		}
	}

	// Auto-connect if enabled and not already handled for EIP6963
	if (autoConnect && !eip6963HandledElsewhere) {
		console.log('[ConnectKit] Running auto-connect for non-EIP6963 wallets');
		// Small delay to ensure connectors are registered
		setTimeout(async () => {
			await store.autoConnect();
		}, 100);
	}

	return {
		store,
		connectors
	};
}

/**
 * Helper to get chain by ID
 */
export function getChainById(chainId: number): Chain | undefined {
	return defaultChains.find((chain) => chain.id === chainId);
}

/**
 * Format chain name for display
 */
export function formatChainName(chainId: number): string {
	const chain = getChainById(chainId);
	return chain?.name || `Chain ${chainId}`;
}
