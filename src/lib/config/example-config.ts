import { mainnet, polygon, arbitrum, optimism } from 'viem/chains';
import type { ConnectKitConfig } from '../types/connectkit-config.js';
import type { SubscriptionConfig } from '../types/subscription-config.js';
import { fusionistEndurance } from '../config/chains/fusionist-endurance.js';

/**
 * Example subscription configuration
 * Users can customize tiers and periods based on their smart contract
 */
export const exampleSubscriptionConfig: SubscriptionConfig = {
	enabled: true,
	networks: [
		{
			chainId: 648, // Fusionist Endurance
			contractAddress: '0x8186c8F5e02a840ff66AC862f0C3F9599B9059D3',
			chain: fusionistEndurance,
			tiers: [
				{
					value: 0,
					name: 'PRO',
					displayName: 'PRO 专业版'
				},
				{
					value: 1,
					name: 'MAX',
					displayName: 'MAX 旗舰版'
				}
			],
			periods: [
				{
					value: 0,
					name: 'MONTHLY',
					displayName: '月付',
					days: 30
				},
				{
					value: 1,
					name: 'YEARLY',
					displayName: '年付 (优惠 17%)',
					days: 365
				}
			]
		},
		{
			chainId: 1, // Ethereum Mainnet
			contractAddress: '0x0000000000000000000000000000000000000000', // Replace with actual contract
			chain: mainnet,
			tiers: [
				{
					value: 0,
					name: 'BASIC',
					displayName: 'Basic'
				},
				{
					value: 1,
					name: 'PREMIUM',
					displayName: 'Premium'
				},
				{
					value: 2,
					name: 'ENTERPRISE',
					displayName: 'Enterprise'
				}
			],
			periods: [
				{
					value: 0,
					name: 'MONTHLY',
					displayName: 'Monthly',
					days: 30
				},
				{
					value: 1,
					name: 'QUARTERLY',
					displayName: 'Quarterly (Save 10%)',
					days: 90
				},
				{
					value: 2,
					name: 'YEARLY',
					displayName: 'Yearly (Save 20%)',
					days: 365
				}
			]
		}
	],
	defaultTier: 0,
	defaultPeriod: 0,
	showReferrerInput: true,
	bufferPercentage: 1 // 1% buffer for gas fluctuations
};

/**
 * Example ConnectKit configuration
 */
export const exampleConfig: ConnectKitConfig = {
	// App information
	appName: 'My DApp',
	appDescription: 'Decentralized application with subscription features',
	appUrl: 'https://mydapp.com',
	appIcon: 'https://mydapp.com/icon.png',

	// Supported chains
	chains: [mainnet, polygon, arbitrum, optimism, fusionistEndurance],
	defaultChainId: 1,

	// Optional subscription configuration
	subscription: exampleSubscriptionConfig,

	// UI customization
	theme: 'auto',
	accentColor: '#007AFF',
	borderRadius: 'medium',

	// Feature flags
	features: {
		multiAccount: true,
		networkSwitching: true,
		siweAuth: true,
		ensResolution: true,
		walletConnectQR: true
	},

	// Modal options
	modal: {
		disableClose: false,
		overlayBlur: true
	},

	// Callbacks
	onConnect: (address, chainId) => {
		console.log(`Connected: ${address} on chain ${chainId}`);
	},
	onDisconnect: () => {
		console.log('Disconnected');
	},
	onChainChanged: (chainId) => {
		console.log(`Chain changed to: ${chainId}`);
	},
	onAccountsChanged: (accounts) => {
		console.log(`Accounts changed:`, accounts);
	},
	onError: (error) => {
		console.error('ConnectKit error:', error);
	}
};

/**
 * Example configuration without subscription
 */
export const minimalConfig: ConnectKitConfig = {
	appName: 'Simple DApp',
	chains: [mainnet, polygon]
	// No subscription config - subscription features will be disabled
};

/**
 * Example configuration with subscription disabled
 */
export const disabledSubscriptionConfig: ConnectKitConfig = {
	appName: 'DApp with Disabled Subscription',
	chains: [mainnet],
	subscription: {
		enabled: false,
		networks: [] // No networks configured
	}
};
