import type { Chain } from 'viem';
import type { ConnectorOptions } from '../connectors/types.js';
import type { SubscriptionConfig } from './subscription-config.js';

/**
 * Main ConnectKit configuration
 */
export interface ConnectKitConfig {
	// Application information
	appName: string;
	appDescription?: string;
	appUrl?: string;
	appIcon?: string;

	// Supported chains for wallet connection
	chains: Chain[];

	// Default chain ID
	defaultChainId?: number;

	// Connector options
	connectorOptions?: ConnectorOptions;

	// Subscription system configuration (optional)
	subscription?: SubscriptionConfig;

	// UI customization
	theme?: 'light' | 'dark' | 'auto';
	accentColor?: string;
	borderRadius?: 'none' | 'small' | 'medium' | 'large';

	// Feature flags
	features?: {
		multiAccount?: boolean; // Support multiple account selection
		networkSwitching?: boolean; // Allow network switching
		siweAuth?: boolean; // Sign-In with Ethereum
		ensResolution?: boolean; // ENS name resolution
		walletConnectQR?: boolean; // Show WalletConnect QR code
	};

	// Custom modal options
	modal?: {
		disableClose?: boolean; // Prevent closing modal
		overlayBlur?: boolean; // Blur background when modal is open
		className?: string; // Custom CSS class for modal
	};

	// Callbacks
	onConnect?: (address: string, chainId: number) => void;
	onDisconnect?: () => void;
	onChainChanged?: (chainId: number) => void;
	onAccountsChanged?: (accounts: string[]) => void;
	onError?: (error: Error) => void;
}

/**
 * Default configuration values
 */
export const defaultConfig: Partial<ConnectKitConfig> = {
	theme: 'auto',
	borderRadius: 'medium',
	features: {
		multiAccount: true,
		networkSwitching: true,
		siweAuth: false,
		ensResolution: true,
		walletConnectQR: true
	},
	modal: {
		disableClose: false,
		overlayBlur: true
	}
};

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: ConnectKitConfig): ConnectKitConfig {
	return {
		...defaultConfig,
		...userConfig,
		features: {
			...defaultConfig.features,
			...userConfig.features
		},
		modal: {
			...defaultConfig.modal,
			...userConfig.modal
		},
		// Subscription is optional, don't merge with defaults
		subscription: userConfig.subscription
	};
}
