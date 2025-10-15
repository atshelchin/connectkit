import {
	createPublicClient,
	http,
	type PublicClient,
	type Address,
	encodeFunctionData
} from 'viem';
import type { WalletStore } from '$lib/connectors/index.js';
import {
	SubscriptionStatus,
	type SubscriptionInfo,
	type UserSubscription,
	type SubscriptionPlan
} from '$lib/types/subscription.js';
import type { SubscriptionNetworkConfig } from '$lib/types/subscription-config.js';

interface EthereumProvider {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

interface ConnectorWithProvider {
	provider?: EthereumProvider;
	getProvider?: () => Promise<EthereumProvider>;
}

async function getProviderFromConnector(connector: unknown): Promise<EthereumProvider> {
	const conn = connector as ConnectorWithProvider;
	if (conn.provider) {
		return conn.provider;
	} else if (conn.getProvider && typeof conn.getProvider === 'function') {
		return await conn.getProvider();
	} else {
		throw new Error('Unable to get provider from connector');
	}
}

const SUBSCRIPTION_ABI = [
	{
		name: 'hasActiveSubscription',
		type: 'function',
		stateMutability: 'view',
		inputs: [{ name: 'user', type: 'address' }],
		outputs: [{ type: 'bool' }]
	},
	{
		name: 'getUserSubscription',
		type: 'function',
		stateMutability: 'view',
		inputs: [{ name: 'user', type: 'address' }],
		outputs: [
			{
				name: 'subscription',
				type: 'tuple',
				components: [
					{ name: 'user', type: 'address' },
					{ name: 'referrer', type: 'address' },
					{ name: 'tier', type: 'uint8' },
					{ name: 'period', type: 'uint8' },
					{ name: 'startTime', type: 'uint256' },
					{ name: 'endTime', type: 'uint256' },
					{ name: 'paidAmount', type: 'uint256' },
					{ name: 'rewardEarned', type: 'uint256' }
				]
			}
		]
	},
	{
		name: 'getPlan',
		type: 'function',
		stateMutability: 'view',
		inputs: [{ name: 'tier', type: 'uint8' }],
		outputs: [
			{
				name: 'plan',
				type: 'tuple',
				components: [
					{ name: 'tier', type: 'uint8' },
					{ name: 'monthlyPrice', type: 'uint256' },
					{ name: 'yearlyPrice', type: 'uint256' },
					{ name: 'features', type: 'string[]' }
				]
			}
		]
	},
	{
		name: 'getAllPlans',
		type: 'function',
		stateMutability: 'view',
		inputs: [],
		outputs: [
			{
				name: 'allPlans',
				type: 'tuple[]',
				components: [
					{ name: 'tier', type: 'uint8' },
					{ name: 'monthlyPrice', type: 'uint256' },
					{ name: 'yearlyPrice', type: 'uint256' },
					{ name: 'features', type: 'string[]' }
				]
			}
		]
	},
	{
		name: 'subscribe',
		type: 'function',
		stateMutability: 'payable',
		inputs: [
			{ name: 'tier', type: 'uint8' },
			{ name: 'period', type: 'uint8' },
			{ name: 'referrer', type: 'address' }
		],
		outputs: []
	},
	{
		name: 'renew',
		type: 'function',
		stateMutability: 'payable',
		inputs: [{ name: 'period', type: 'uint8' }],
		outputs: []
	},
	{
		name: 'upgrade',
		type: 'function',
		stateMutability: 'payable',
		inputs: [{ name: 'newTier', type: 'uint8' }],
		outputs: []
	},
	{
		name: 'downgrade',
		type: 'function',
		stateMutability: 'payable',
		inputs: [
			{ name: 'newTier', type: 'uint8' },
			{ name: 'period', type: 'uint8' }
		],
		outputs: []
	}
] as const;

export class SubscriptionService {
	private walletStore: WalletStore;
	private networkConfig: SubscriptionNetworkConfig;
	private publicClient: PublicClient;
	private bufferPercentage: number;

	constructor(
		walletStore: WalletStore,
		networkConfig: SubscriptionNetworkConfig,
		bufferPercentage: number = 1
	) {
		this.walletStore = walletStore;
		this.networkConfig = networkConfig;
		this.bufferPercentage = bufferPercentage;

		const chain = networkConfig.chain;
		if (!chain) {
			throw new Error('Chain configuration is required for subscription service');
		}

		this.publicClient = createPublicClient({
			chain,
			transport: http(chain.rpcUrls.default.http[0])
		});
	}

	async getSubscriptionInfo(userAddress: Address): Promise<SubscriptionInfo> {
		try {
			const subscription = await this.getUserSubscription(userAddress);

			// Get all plans from contract
			let plans: SubscriptionPlan[] = [];
			try {
				plans = await this.getAllPlans();
			} catch (err) {
				console.warn('Failed to get plans, using defaults:', err);
				// Add default PRO plan if getAllPlans fails
				plans = [
					{
						tier: 0,
						monthlyPrice: BigInt('10000000000000000'), // 0.01 ETH default
						yearlyPrice: BigInt('100000000000000000'), // 0.1 ETH default
						features: ['基础订阅功能']
					}
				];
			}

			const now = BigInt(Math.floor(Date.now() / 1000));
			const status = subscription && subscription.endTime > now ? 0 : 1;
			const daysRemaining = subscription
				? Math.max(0, Math.floor(Number(subscription.endTime - now) / 86400))
				: 0;

			// Only show upgrade if MAX plan exists
			const hasMaxPlan = plans.some((p) => p.tier === 1);
			const canUpgrade: boolean =
				hasMaxPlan && !!subscription && subscription.tier === 0 && status === 0;
			const canDowngrade: boolean = !!subscription && subscription.tier === 1 && status === 1;
			const canRenew: boolean = !!subscription && status === 1;

			return {
				subscription: subscription || null,
				status: status as SubscriptionStatus,
				plans,
				canUpgrade,
				canDowngrade,
				canRenew,
				daysRemaining
			};
		} catch (error) {
			console.error('Failed to get subscription info:', error);
			throw error;
		}
	}

	async hasActiveSubscription(userAddress: Address): Promise<boolean> {
		return (await this.publicClient.readContract({
			address: this.networkConfig.contractAddress,
			abi: SUBSCRIPTION_ABI,
			functionName: 'hasActiveSubscription',
			args: [userAddress]
		})) as boolean;
	}

	async getUserSubscription(userAddress: Address): Promise<UserSubscription | null> {
		try {
			const result = (await this.publicClient.readContract({
				address: this.networkConfig.contractAddress,
				abi: SUBSCRIPTION_ABI,
				functionName: 'getUserSubscription',
				args: [userAddress]
			})) as {
				user: Address;
				referrer: Address;
				tier: number;
				period: number;
				startTime: bigint;
				endTime: bigint;
				paidAmount: bigint;
				rewardEarned: bigint;
			};

			if (!result || result.user === '0x0000000000000000000000000000000000000000') {
				return null;
			}

			return {
				user: result.user,
				referrer: result.referrer,
				tier: result.tier,
				period: result.period,
				startTime: result.startTime,
				endTime: result.endTime,
				paidAmount: result.paidAmount,
				rewardEarned: result.rewardEarned
			};
		} catch (error) {
			console.error('Failed to get user subscription:', error);
			return null;
		}
	}

	async getAllPlans(): Promise<SubscriptionPlan[]> {
		try {
			const result = (await this.publicClient.readContract({
				address: this.networkConfig.contractAddress,
				abi: SUBSCRIPTION_ABI,
				functionName: 'getAllPlans',
				args: []
			})) as Array<{
				tier: number;
				monthlyPrice: bigint;
				yearlyPrice: bigint;
				features: string[];
			}>;

			return result.map((plan) => ({
				tier: Number(plan.tier),
				monthlyPrice: BigInt(plan.monthlyPrice),
				yearlyPrice: BigInt(plan.yearlyPrice),
				features: plan.features || []
			}));
		} catch (error) {
			console.error('Failed to get all plans:', error);
			throw error;
		}
	}

	async getPlan(tier: number): Promise<SubscriptionPlan> {
		try {
			const result = (await this.publicClient.readContract({
				address: this.networkConfig.contractAddress,
				abi: SUBSCRIPTION_ABI,
				functionName: 'getPlan',
				args: [tier]
			})) as {
				tier: number;
				monthlyPrice: bigint;
				yearlyPrice: bigint;
				features: string[];
			};

			return {
				tier: Number(result.tier ?? tier),
				monthlyPrice: BigInt(result.monthlyPrice ?? 0),
				yearlyPrice: BigInt(result.yearlyPrice ?? 0),
				features: result.features || []
			};
		} catch (error) {
			console.error(`Failed to get plan for tier ${tier}:`, error);
			throw error;
		}
	}

	async subscribe(
		tier: number,
		period: number,
		referrer: Address = '0x0000000000000000000000000000000000000000' as Address
	): Promise<void> {
		const state = this.walletStore.state;
		if (!state.isConnected) throw new Error('Wallet not connected');
		if (!state.address) throw new Error('No wallet address');

		// Get price from plan
		const plan = await this.getPlan(tier);
		const basePrice = period === 0 ? plan.monthlyPrice : plan.yearlyPrice; // 0 = MONTHLY, 1 = YEARLY
		// Add buffer to ensure transaction success
		const price = basePrice + (basePrice * BigInt(this.bufferPercentage)) / BigInt(100);
		const connector = state.connector;
		if (!connector) throw new Error('No connector available');

		const provider = await getProviderFromConnector(connector);

		// Encode function call
		const data = encodeFunctionData({
			abi: SUBSCRIPTION_ABI,
			functionName: 'subscribe',
			args: [tier, period, referrer]
		});

		// Send transaction through provider
		const tx = {
			to: this.networkConfig.contractAddress,
			from: this.walletStore.state.address,
			value: `0x${price.toString(16)}`,
			data
		};

		const hash = (await provider.request({
			method: 'eth_sendTransaction',
			params: [tx]
		})) as `0x${string}`;

		await this.publicClient.waitForTransactionReceipt({ hash });
	}

	async renew(period: number): Promise<void> {
		const state = this.walletStore.state;
		if (!state.isConnected) throw new Error('Wallet not connected');
		if (!state.address) throw new Error('No wallet address');

		const subscription = await this.getUserSubscription(state.address as Address);
		if (!subscription) throw new Error('No subscription found');

		// Get price from plan
		const plan = await this.getPlan(subscription.tier);
		const basePrice = period === 0 ? plan.monthlyPrice : plan.yearlyPrice; // 0 = MONTHLY, 1 = YEARLY
		// Add buffer to ensure transaction success
		const price = basePrice + (basePrice * BigInt(this.bufferPercentage)) / BigInt(100);
		const connector = state.connector;
		if (!connector) throw new Error('No connector available');

		const provider = await getProviderFromConnector(connector);

		// Encode function call
		const data = encodeFunctionData({
			abi: SUBSCRIPTION_ABI,
			functionName: 'renew',
			args: [period]
		});

		const tx = {
			to: this.networkConfig.contractAddress,
			from: state.address,
			value: `0x${price.toString(16)}`,
			data
		};

		const hash = (await provider.request({
			method: 'eth_sendTransaction',
			params: [tx]
		})) as `0x${string}`;

		await this.publicClient.waitForTransactionReceipt({ hash });
	}

	async upgrade(newTier: number = 1, period: number = 0): Promise<void> {
		// Default to MAX (1) and MONTHLY (0)
		const state = this.walletStore.state;
		if (!state.isConnected) throw new Error('Wallet not connected');
		if (!state.address) throw new Error('No wallet address');

		// Get current subscription
		const subscription = await this.getUserSubscription(state.address as Address);
		if (!subscription) throw new Error('No active subscription');

		// Get both plans
		const currentPlan = await this.getPlan(subscription.tier);
		const newPlan = await this.getPlan(newTier);

		// Calculate remaining time
		const currentTime = BigInt(Math.floor(Date.now() / 1000));
		const remainingSeconds =
			subscription.endTime > currentTime ? subscription.endTime - currentTime : BigInt(0);

		// Calculate price:
		// 1. Price difference for remaining time (upgrade cost for current period)
		// Use seconds for more precise calculation to avoid rounding errors
		const currentPeriodSeconds =
			subscription.period === 0
				? BigInt(30 * 86400) // 30 days in seconds for MONTHLY
				: BigInt(365 * 86400); // 365 days in seconds for YEARLY
		const currentPeriodPrice =
			subscription.period === 0 ? currentPlan.monthlyPrice : currentPlan.yearlyPrice;
		const newPeriodPrice = subscription.period === 0 ? newPlan.monthlyPrice : newPlan.yearlyPrice;

		// Calculate per-second price difference and multiply by remaining seconds
		// This avoids integer division precision loss
		const priceDifference = newPeriodPrice - currentPeriodPrice;
		// Calculate: (priceDifference * remainingSeconds) / currentPeriodSeconds
		// Do multiplication first to maintain precision
		const remainingCost = (priceDifference * remainingSeconds) / currentPeriodSeconds;

		// 2. Full price for the new period
		const newFullPeriodPrice = period === 0 ? newPlan.monthlyPrice : newPlan.yearlyPrice; // 0 = MONTHLY, 1 = YEARLY

		// Total upgrade price = remaining time difference + new period full price
		const basePrice = remainingCost + newFullPeriodPrice;
		// Add buffer to ensure transaction success
		const price = basePrice + (basePrice * BigInt(this.bufferPercentage)) / BigInt(100);

		const connector = state.connector;
		if (!connector) throw new Error('No connector available');

		const provider = await getProviderFromConnector(connector);

		// Encode function call
		const data = encodeFunctionData({
			abi: SUBSCRIPTION_ABI,
			functionName: 'upgrade',
			args: [newTier]
		});

		const tx = {
			to: this.networkConfig.contractAddress,
			from: state.address,
			value: `0x${price.toString(16)}`,
			data
		};

		const hash = (await provider.request({
			method: 'eth_sendTransaction',
			params: [tx]
		})) as `0x${string}`;

		await this.publicClient.waitForTransactionReceipt({ hash });
	}

	async downgrade(newTier: number = 0, period: number = 0): Promise<void> {
		// Default to PRO (0) and MONTHLY (0)
		const state = this.walletStore.state;
		if (!state.isConnected) throw new Error('Wallet not connected');
		if (!state.address) throw new Error('No wallet address');

		// Get price for the new tier
		const plan = await this.getPlan(newTier);
		const basePrice = period === 0 ? plan.monthlyPrice : plan.yearlyPrice; // 0 = MONTHLY, 1 = YEARLY
		// Add buffer to ensure transaction success
		const price = basePrice + (basePrice * BigInt(this.bufferPercentage)) / BigInt(100);

		const connector = state.connector;
		if (!connector) throw new Error('No connector available');

		const provider = await getProviderFromConnector(connector);

		// Encode function call
		const data = encodeFunctionData({
			abi: SUBSCRIPTION_ABI,
			functionName: 'downgrade',
			args: [newTier, period]
		});

		const tx = {
			to: this.networkConfig.contractAddress,
			from: state.address,
			value: `0x${price.toString(16)}`,
			data
		};

		const hash = (await provider.request({
			method: 'eth_sendTransaction',
			params: [tx]
		})) as `0x${string}`;

		await this.publicClient.waitForTransactionReceipt({ hash });
	}
}
