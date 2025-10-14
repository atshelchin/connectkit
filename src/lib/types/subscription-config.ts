import type { Address, Chain } from 'viem';

/**
 * Subscription tier configuration
 */
export interface SubscriptionTierConfig {
	value: number;
	name: string;
	displayName: string;
}

/**
 * Subscription period configuration
 */
export interface SubscriptionPeriodConfig {
	value: number;
	name: string;
	displayName: string;
	days: number;
}

/**
 * Subscription network configuration
 */
export interface SubscriptionNetworkConfig {
	chainId: number;
	contractAddress: Address;
	chain?: Chain;
	tiers: SubscriptionTierConfig[];
	periods: SubscriptionPeriodConfig[];
}

/**
 * Complete subscription configuration
 * If not provided or enabled is false, subscription system is disabled
 */
export interface SubscriptionConfig {
	// Enable subscription system
	enabled: boolean;
	// Networks that support subscription
	networks: SubscriptionNetworkConfig[];
	// Default tier and period values
	defaultTier?: number;
	defaultPeriod?: number;
	// UI customization
	showReferrerInput?: boolean;
	bufferPercentage?: number; // Default 1%
}

/**
 * Helper to get network config by chain ID
 */
export function getNetworkConfig(
	config: SubscriptionConfig,
	chainId: number
): SubscriptionNetworkConfig | undefined {
	return config.networks.find((n) => n.chainId === chainId);
}

/**
 * Check if a chain supports subscriptions
 */
export function isSubscriptionSupported(config: SubscriptionConfig, chainId: number): boolean {
	return config.networks.some((n) => n.chainId === chainId);
}
