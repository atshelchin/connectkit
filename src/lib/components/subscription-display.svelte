<script lang="ts">
	import { onMount } from 'svelte';
	import type { WalletStore } from '../connectors/index.js';
	import { SubscriptionService } from '$lib/core/services/subscription-service.js';
	import { SubscriptionStatus, type SubscriptionInfo } from '$lib/types/subscription.js';
	import type {
		SubscriptionConfig,
		SubscriptionNetworkConfig
	} from '$lib/types/subscription-config.js';
	import type { Address } from 'viem';
	import { formatEther } from 'viem';

	interface Props {
		walletStore: WalletStore;
		config: SubscriptionConfig;
		chainId: number;
		onClose?: () => void;
	}

	let { walletStore, config, chainId, onClose }: Props = $props();

	let subscriptionService: SubscriptionService | null = null;
	let networkConfig = $state<SubscriptionNetworkConfig | null>(null);
	let subscriptionInfo = $state<SubscriptionInfo | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedPeriod = $state<number>(config?.defaultPeriod || 0); // Default to MONTHLY (0)
	let selectedTier = $state<number>(config?.defaultTier || 0); // Default to first tier
	let isProcessing = $state(false);
	let referrerAddress = $state<string>('');

	onMount(async () => {
		// Check if config is provided
		if (!config || !config.enabled) {
			error = '订阅服务未启用';
			loading = false;
			return;
		}

		// Find network config for current chain
		networkConfig = config.networks.find((n) => n.chainId === chainId) || null;

		if (!networkConfig) {
			error = '当前网络不支持订阅服务';
			loading = false;
			return;
		}

		subscriptionService = new SubscriptionService(
			walletStore,
			networkConfig,
			config?.bufferPercentage || 1
		);
		await loadSubscriptionInfo();
	});

	async function loadSubscriptionInfo() {
		const address = walletStore.state.address;
		if (!address) {
			error = '请先连接钱包';
			loading = false;
			return;
		}

		if (!subscriptionService) {
			error = '订阅服务未初始化';
			loading = false;
			return;
		}

		try {
			loading = true;
			error = null;
			subscriptionInfo = await subscriptionService.getSubscriptionInfo(address as Address);
		} catch (err) {
			console.error('Failed to load subscription info:', err);
			error = '加载订阅信息失败';
		} finally {
			loading = false;
		}
	}

	async function handleSubscribe() {
		if (!subscriptionService) return;

		try {
			isProcessing = true;
			error = null;
			// Use referrer address if provided, otherwise use zero address
			const referrer =
				referrerAddress && referrerAddress.match(/^0x[a-fA-F0-9]{40}$/)
					? (referrerAddress as Address)
					: ('0x0000000000000000000000000000000000000000' as Address);
			await subscriptionService.subscribe(selectedTier, selectedPeriod, referrer);
			await loadSubscriptionInfo();
			// Clear referrer after successful subscription
			referrerAddress = '';
		} catch (err: unknown) {
			console.error('Subscribe failed:', err);
			error = err instanceof Error ? err.message : '订阅失败';
		} finally {
			isProcessing = false;
		}
	}

	async function handleRenew() {
		if (!subscriptionService) return;

		try {
			isProcessing = true;
			error = null;
			await subscriptionService.renew(selectedPeriod);
			await loadSubscriptionInfo();
		} catch (err: unknown) {
			console.error('Renew failed:', err);
			error = err instanceof Error ? err.message : '续费失败';
		} finally {
			isProcessing = false;
		}
	}

	async function handleUpgrade() {
		if (!subscriptionService || !networkConfig) return;

		try {
			isProcessing = true;
			error = null;
			// Find MAX tier value from config
			const maxTier = Math.max(...networkConfig.tiers.map((t) => t.value));
			await subscriptionService.upgrade(maxTier, selectedPeriod);
			await loadSubscriptionInfo();
		} catch (err: unknown) {
			console.error('Upgrade failed:', err);
			error = err instanceof Error ? err.message : '升级失败';
		} finally {
			isProcessing = false;
		}
	}

	// Calculate upgrade price and new expiry
	function calculateUpgradeInfo() {
		if (!subscriptionInfo?.subscription || !subscriptionInfo?.plans || !networkConfig) return null;

		const subscription = subscriptionInfo.subscription; // Create local reference for type narrowing
		const plans = subscriptionInfo.plans;

		const currentPlan = plans.find((p) => p.tier === subscription.tier);
		// Find MAX tier value from config
		const maxTierValue = Math.max(...networkConfig.tiers.map((t) => t.value));
		const maxPlan = plans.find((p) => p.tier === maxTierValue);
		if (!currentPlan || !maxPlan) return null;

		const currentTime = BigInt(Math.floor(Date.now() / 1000));
		const remainingSeconds =
			subscription.endTime > currentTime ? subscription.endTime - currentTime : BigInt(0);

		// Calculate price difference for remaining time using seconds for precision
		const currentPeriod = networkConfig.periods.find((p) => p.value === subscription.period);
		if (!currentPeriod) return null;

		const currentPeriodSeconds = BigInt(currentPeriod.days * 86400);
		const currentPeriodPrice =
			subscription.period === 0 ? currentPlan.monthlyPrice : currentPlan.yearlyPrice;
		const newPeriodPrice = subscription.period === 0 ? maxPlan.monthlyPrice : maxPlan.yearlyPrice;

		// Calculate per-second price difference and multiply by remaining seconds
		const priceDifference = newPeriodPrice - currentPeriodPrice;
		const remainingCost = (priceDifference * remainingSeconds) / currentPeriodSeconds;

		// New period price
		const selectedPeriodConfig = networkConfig.periods.find((p) => p.value === selectedPeriod);
		if (!selectedPeriodConfig) return null;

		const newFullPeriodPrice = selectedPeriod === 0 ? maxPlan.monthlyPrice : maxPlan.yearlyPrice;

		// Total price with 1% buffer (same as backend)
		const basePrice = remainingCost + newFullPeriodPrice;
		const totalPrice = basePrice + basePrice / BigInt(100);

		// Calculate days for display
		const remainingDays = Number(remainingSeconds / BigInt(86400));
		const newPeriodDays = selectedPeriodConfig.days;
		const newEndTime = subscription.endTime + BigInt(newPeriodDays * 86400);
		const newTotalDays = Number((newEndTime - currentTime) / BigInt(86400));

		return {
			price: totalPrice,
			newDays: newTotalDays,
			currentDays: remainingDays
		};
	}

	async function handleDowngrade() {
		if (!subscriptionService || !networkConfig) return;

		try {
			isProcessing = true;
			error = null;
			// Find PRO tier value from config (usually the minimum)
			const proTier = Math.min(...networkConfig.tiers.map((t) => t.value));
			await subscriptionService.downgrade(proTier, selectedPeriod);
			await loadSubscriptionInfo();
		} catch (err: unknown) {
			console.error('Downgrade failed:', err);
			error = err instanceof Error ? err.message : '降级失败';
		} finally {
			isProcessing = false;
		}
	}

	function getTierName(tier: number): string {
		if (!networkConfig) return '';
		const tierConfig = networkConfig.tiers.find((t) => t.value === tier);
		return tierConfig?.displayName || tierConfig?.name || `Tier ${tier}`;
	}

	function getPeriodName(period: number): string {
		if (!networkConfig) return '';
		const periodConfig = networkConfig.periods.find((p) => p.value === period);
		return periodConfig?.displayName || periodConfig?.name || `Period ${period}`;
	}

	function formatPrice(price: bigint): string {
		const etherValue = formatEther(price);
		// Parse the value and format with max 6 decimal places
		const numValue = parseFloat(etherValue);
		// Use toFixed but remove trailing zeros
		const formatted = numValue.toFixed(6).replace(/\.?0+$/, '');
		return `${formatted} ${networkConfig?.chain?.nativeCurrency?.symbol || 'ETH'}`;
	}

	$effect(() => {
		if (walletStore.state.address) {
			loadSubscriptionInfo();
		}
	});
</script>

<div class="subscription-container">
	{#if onClose}
		<button class="close-btn" onclick={onClose} aria-label="关闭">
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M18 6L6 18M6 6l12 12"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				/>
			</svg>
		</button>
	{/if}

	<h2 class="subscription-title">订阅管理</h2>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>加载中...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p class="error-message">{error}</p>
			<button class="retry-btn" onclick={loadSubscriptionInfo}>重试</button>
		</div>
	{:else if subscriptionInfo}
		{#if subscriptionInfo.subscription}
			<!-- 已有订阅 -->
			<div class="subscription-status">
				<div class="status-header">
					<span
						class="tier-badge tier-{getTierName(subscriptionInfo.subscription.tier).toLowerCase()}"
					>
						{getTierName(subscriptionInfo.subscription.tier)}
					</span>
					<span
						class="status-badge status-{subscriptionInfo.status === SubscriptionStatus.ACTIVE
							? 'active'
							: 'expired'}"
					>
						{subscriptionInfo.status === SubscriptionStatus.ACTIVE ? '有效' : '已过期'}
					</span>
				</div>

				<div class="subscription-details">
					<div class="detail-item">
						<span class="detail-label">订阅类型</span>
						<span class="detail-value">{getPeriodName(subscriptionInfo.subscription.period)}</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">剩余天数</span>
						<span
							class="detail-value value-{subscriptionInfo.daysRemaining > 0
								? 'positive'
								: 'negative'}"
						>
							{subscriptionInfo.daysRemaining} 天
						</span>
					</div>
					<div class="detail-item">
						<span class="detail-label">支付金额</span>
						<span class="detail-value">{formatPrice(subscriptionInfo.subscription.paidAmount)}</span
						>
					</div>
				</div>

				<!-- 操作按钮 -->
				<div class="action-section">
					{#if subscriptionInfo.canUpgrade}
						<div class="upgrade-section">
							<h4>升级到 MAX 套餐</h4>
							<div class="period-selector">
								<label>
									<input type="radio" name="upgrade-period" value={0} bind:group={selectedPeriod} />
									月付
								</label>
								<label>
									<input type="radio" name="upgrade-period" value={1} bind:group={selectedPeriod} />
									年付 (优惠 17%)
								</label>
							</div>

							{#if subscriptionInfo.subscription}
								{@const upgradeInfo = calculateUpgradeInfo()}
								{#if upgradeInfo}
									<div class="upgrade-details">
										<div class="detail-item">
											<span class="detail-label"
												>升级费用 <span class="price-hint">(含手续费)</span></span
											>
											<span class="detail-value value-primary"
												>{formatPrice(upgradeInfo.price)}</span
											>
										</div>
										<div class="detail-item">
											<span class="detail-label">当前剩余天数</span>
											<span class="detail-value">{upgradeInfo.currentDays} 天</span>
										</div>
										<div class="detail-item">
											<span class="detail-label">升级后总天数</span>
											<span class="detail-value value-positive">{upgradeInfo.newDays} 天</span>
										</div>
									</div>
								{/if}
							{/if}

							<button
								class="action-btn upgrade-btn"
								onclick={handleUpgrade}
								disabled={isProcessing}
							>
								{isProcessing ? '处理中...' : '确认升级'}
							</button>
						</div>
					{/if}

					{#if subscriptionInfo.canRenew}
						<div class="renew-section">
							<h4>续费当前套餐</h4>
							<div class="period-selector">
								<label>
									<input type="radio" name="renew-period" value={0} bind:group={selectedPeriod} />
									月付
								</label>
								<label>
									<input type="radio" name="renew-period" value={1} bind:group={selectedPeriod} />
									年付 (优惠 17%)
								</label>
							</div>

							{#if subscriptionInfo?.subscription && subscriptionInfo?.plans}
								{@const currentPlan = subscriptionInfo.plans.find(
									(p) => p.tier === subscriptionInfo!.subscription!.tier
								)}
								{#if currentPlan}
									<div class="renew-details">
										<div class="detail-item">
											<span class="detail-label"
												>续费价格 <span class="price-hint">(含手续费)</span></span
											>
											<span class="detail-value value-primary">
												{formatPrice(
													(() => {
														const basePrice =
															selectedPeriod === 0
																? currentPlan.monthlyPrice
																: currentPlan.yearlyPrice;
														return (
															basePrice +
															(basePrice * BigInt(config?.bufferPercentage || 1)) / BigInt(100)
														);
													})()
												)}
											</span>
										</div>
										<div class="detail-item">
											<span class="detail-label">延长天数</span>
											<span class="detail-value value-positive">
												{networkConfig?.periods.find((p) => p.value === selectedPeriod)?.days || 30}
												天
											</span>
										</div>
									</div>
								{/if}
							{/if}

							<button class="action-btn renew-btn" onclick={handleRenew} disabled={isProcessing}>
								{isProcessing ? '处理中...' : '确认续费'}
							</button>
						</div>
					{/if}

					{#if subscriptionInfo.canDowngrade}
						<div class="downgrade-section">
							<h4>降级到 PRO 套餐</h4>
							<div class="period-selector">
								<label>
									<input
										type="radio"
										name="downgrade-period"
										value={0}
										bind:group={selectedPeriod}
									/>
									月付
								</label>
								<label>
									<input
										type="radio"
										name="downgrade-period"
										value={1}
										bind:group={selectedPeriod}
									/>
									年付 (优惠 17%)
								</label>
							</div>

							{#if subscriptionInfo.plans}
								{@const proPlan = subscriptionInfo.plans.find((p) => p.tier === 0)}
								{#if proPlan}
									<div class="downgrade-details">
										<div class="detail-item">
											<span class="detail-label"
												>降级后价格 <span class="price-hint">(含手续费)</span></span
											>
											<span class="detail-value value-primary">
												{formatPrice(
													(() => {
														const basePrice =
															selectedPeriod === 0 ? proPlan.monthlyPrice : proPlan.yearlyPrice;
														return basePrice + basePrice / BigInt(100);
													})()
												)}
											</span>
										</div>
										<div class="detail-item">
											<span class="detail-label">新周期天数</span>
											<span class="detail-value">
												{networkConfig?.periods.find((p) => p.value === selectedPeriod)?.days || 30}
												天
											</span>
										</div>
									</div>
								{/if}
							{/if}

							<button
								class="action-btn downgrade-btn"
								onclick={handleDowngrade}
								disabled={isProcessing}
							>
								{isProcessing ? '处理中...' : '确认降级'}
							</button>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<!-- 未订阅 -->
			<div class="no-subscription">
				<p class="no-sub-message">您还没有订阅</p>

				<!-- 推荐人输入 -->
				<div class="referrer-section">
					<label for="referrer-input" class="referrer-label">推荐人地址 (可选)</label>
					<input
						id="referrer-input"
						type="text"
						bind:value={referrerAddress}
						placeholder="0x..."
						class="referrer-input"
					/>
					{#if referrerAddress && !referrerAddress.match(/^0x[a-fA-F0-9]{40}$/)}
						<span class="error-text">请输入有效的以太坊地址</span>
					{/if}
				</div>

				<!-- 套餐选择 -->
				<div class="plans-grid">
					{#each subscriptionInfo.plans as plan (plan.tier)}
						<button
							type="button"
							class="plan-card {selectedTier === plan.tier ? 'selected' : ''}"
							onclick={() => (selectedTier = plan.tier)}
							aria-pressed={selectedTier === plan.tier}
							aria-label="选择{getTierName(plan.tier)}套餐"
						>
							<h3 class="plan-name">{getTierName(plan.tier)}</h3>
							<div class="plan-prices">
								<div class="price-item">
									<span class="price-label">月付</span>
									<span class="price-value"
										>{formatPrice(plan.monthlyPrice + plan.monthlyPrice / BigInt(100))}</span
									>
								</div>
								<div class="price-item">
									<span class="price-label">年付</span>
									<span class="price-value"
										>{formatPrice(plan.yearlyPrice + plan.yearlyPrice / BigInt(100))}</span
									>
									<span class="discount-badge">省 17%</span>
								</div>
							</div>
							<ul class="features-list">
								{#each plan.features as feature (feature)}
									<li>{feature}</li>
								{/each}
							</ul>
						</button>
					{/each}
				</div>

				<!-- 支付周期选择 -->
				<div class="period-selector">
					{#each networkConfig?.periods || [] as period (period.value)}
						<label>
							<input type="radio" name="period" value={period.value} bind:group={selectedPeriod} />
							{period.displayName}
						</label>
					{/each}
				</div>

				<button
					class="subscribe-btn"
					onclick={handleSubscribe}
					disabled={isProcessing ||
						(!!referrerAddress && !referrerAddress.match(/^0x[a-fA-F0-9]{40}$/))}
				>
					{isProcessing ? '处理中...' : '立即订阅'}
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.subscription-container {
		position: relative;
		background: var(--color-panel-elevated);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		max-width: 600px;
		margin: 0 auto;
		box-shadow: var(--shadow-xl);
	}

	.close-btn {
		position: absolute;
		top: var(--space-4);
		right: var(--space-4);
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: var(--radius);
		color: var(--color-muted-foreground);
		cursor: pointer;
		transition: all 200ms ease;
	}

	.close-btn:hover {
		background: var(--color-muted);
		color: var(--color-foreground);
	}

	.subscription-title {
		font-size: var(--text-2xl);
		font-weight: var(--font-bold);
		color: var(--color-heading-1);
		margin: 0 0 var(--space-6) 0;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-8);
		text-align: center;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--color-muted);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-message {
		color: var(--color-danger);
		margin-bottom: var(--space-4);
	}

	.retry-btn {
		padding: var(--space-2) var(--space-4);
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		font-weight: var(--font-medium);
		transition: opacity 200ms ease;
	}

	.retry-btn:hover {
		opacity: 0.9;
	}

	.subscription-status {
		background: var(--color-panel-1);
		border-radius: var(--radius-md);
		padding: var(--space-5);
	}

	.status-header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-4);
	}

	.tier-badge {
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: var(--font-bold);
	}

	.tier-pro {
		background: var(--brand-100);
		color: var(--brand-700);
	}

	.tier-max {
		background: linear-gradient(135deg, var(--brand-500), var(--brand-600));
		color: white;
	}

	.status-badge {
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.status-active {
		background: var(--color-success);
		color: white;
	}

	.status-expired {
		background: var(--color-danger);
		color: white;
	}

	.subscription-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin-bottom: var(--space-5);
	}

	.detail-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.detail-label {
		color: var(--color-muted-foreground);
		font-size: var(--text-sm);
	}

	.detail-value {
		color: var(--color-foreground);
		font-weight: var(--font-medium);
	}

	.value-positive {
		color: var(--color-success);
	}

	.value-negative {
		color: var(--color-danger);
	}

	.no-subscription {
		text-align: center;
	}

	.no-sub-message {
		color: var(--color-muted-foreground);
		margin-bottom: var(--space-6);
	}

	.plans-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}

	.plan-card {
		background: var(--color-panel-1);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-5);
		cursor: pointer;
		transition: all 200ms ease;
		width: 100%;
		text-align: left;
		font-family: inherit;
		font-size: inherit;
		color: inherit;
	}

	.plan-card:hover {
		border-color: var(--color-primary);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.plan-card.selected {
		border-color: var(--color-primary);
		background: var(--color-panel-accent);
	}

	.plan-name {
		font-size: var(--text-xl);
		font-weight: var(--font-bold);
		color: var(--color-heading-1);
		margin: 0 0 var(--space-4) 0;
	}

	.plan-prices {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}

	.price-item {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.price-label {
		color: var(--color-muted-foreground);
		font-size: var(--text-sm);
	}

	.price-value {
		color: var(--color-primary);
		font-weight: var(--font-bold);
	}

	.discount-badge {
		background: var(--color-success);
		color: white;
		padding: var(--space-0-5) var(--space-2);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		font-weight: var(--font-bold);
	}

	.features-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.features-list li {
		position: relative;
		padding-left: var(--space-5);
		color: var(--color-description-1);
		font-size: var(--text-sm);
	}

	.features-list li::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: var(--color-success);
		font-weight: var(--font-bold);
	}

	.period-selector {
		display: flex;
		justify-content: center;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
		padding: var(--space-3);
		background: var(--color-panel-2);
		border-radius: var(--radius);
	}

	.period-selector label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		cursor: pointer;
		color: var(--color-foreground);
	}

	.period-selector input[type='radio'] {
		cursor: pointer;
	}

	.action-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.upgrade-section,
	.renew-section,
	.downgrade-section {
		background: var(--color-panel-2);
		border-radius: var(--radius-md);
		padding: var(--space-5);
	}

	.upgrade-section h4,
	.renew-section h4,
	.downgrade-section h4 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-heading-1);
	}

	.upgrade-details,
	.renew-details,
	.downgrade-details {
		background: var(--color-panel-1);
		border-radius: var(--radius);
		padding: var(--space-4);
		margin-bottom: var(--space-4);
	}

	.value-primary {
		color: var(--color-primary);
		font-weight: var(--font-bold);
	}

	.price-hint {
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
		font-weight: var(--font-normal);
	}

	.referrer-section {
		margin-bottom: var(--space-6);
		padding: var(--space-4);
		background: var(--color-panel-2);
		border-radius: var(--radius-md);
	}

	.referrer-label {
		display: block;
		margin-bottom: var(--space-2);
		color: var(--color-foreground);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.referrer-input {
		width: 100%;
		padding: var(--space-3);
		background: var(--color-panel-1);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		color: var(--color-foreground);
		font-size: var(--text-base);
		font-family: var(--font-mono);
		transition: all 200ms ease;
	}

	.referrer-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-primary-ring);
	}

	.referrer-input::placeholder {
		color: var(--color-muted-foreground);
	}

	.error-text {
		display: block;
		margin-top: var(--space-2);
		color: var(--color-danger);
		font-size: var(--text-sm);
	}

	.action-buttons {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
	}

	.action-btn,
	.subscribe-btn {
		flex: 1;
		min-width: 120px;
		padding: var(--space-3) var(--space-5);
		border: none;
		border-radius: var(--radius);
		font-weight: var(--font-semibold);
		cursor: pointer;
		transition: all 200ms ease;
	}

	.subscribe-btn {
		width: 100%;
		background: var(--color-primary);
		color: var(--color-primary-foreground);
	}

	.subscribe-btn:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.upgrade-btn {
		background: linear-gradient(135deg, var(--brand-500), var(--brand-600));
		color: white;
	}

	.renew-btn {
		background: var(--color-success);
		color: white;
	}

	.downgrade-btn {
		background: var(--color-warning);
		color: white;
	}

	.action-btn:hover:not(:disabled) {
		opacity: 0.9;
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.action-btn:disabled,
	.subscribe-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		.subscription-container {
			padding: var(--space-4);
		}

		.plans-grid {
			grid-template-columns: 1fr;
		}

		.action-buttons {
			flex-direction: column;
		}

		.action-btn {
			width: 100%;
		}
	}
</style>
