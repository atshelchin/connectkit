import type { Address } from 'viem';

export const SubscriptionStatus = {
	ACTIVE: 0,
	EXPIRED: 1
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export interface SubscriptionPlan {
	tier: number;
	monthlyPrice: bigint;
	yearlyPrice: bigint;
	features: string[];
}

export interface UserSubscription {
	user: Address;
	referrer: Address;
	tier: number;
	period: number;
	startTime: bigint;
	endTime: bigint;
	paidAmount: bigint;
	rewardEarned: bigint;
}

export interface SubscriptionInfo {
	subscription: UserSubscription | null;
	status: SubscriptionStatus;
	plans: SubscriptionPlan[];
	canUpgrade: boolean;
	canDowngrade: boolean;
	canRenew: boolean;
	daysRemaining: number;
}

export interface SubscriptionActions {
	subscribe: (tier: number, period: number, referrer?: Address) => Promise<void>;
	renew: (period: number) => Promise<void>;
	upgrade: (period: number) => Promise<void>;
	downgrade: (period: number) => Promise<void>;
}

export interface SubscriptionContractMethods {
	hasActiveSubscription: (user: Address) => Promise<boolean>;
	getUserSubscription: (user: Address) => Promise<UserSubscription>;
	getPlan: (tier: number) => Promise<SubscriptionPlan>;
	getAllPlans: () => Promise<SubscriptionPlan[]>;
	subscribe: (tier: number, period: number, referrer: Address, value: bigint) => Promise<void>;
	renew: (period: number, value: bigint) => Promise<void>;
	upgrade: (newTier: number, value: bigint) => Promise<void>;
	downgrade: (newTier: number, period: number, value: bigint) => Promise<void>;
}
