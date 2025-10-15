<script lang="ts">
	import Modal from './modal.svelte';
	import type { NetworkConfig } from '$lib/stores/network-config.svelte';

	// 验证步骤状态
	type CheckStatus = 'pending' | 'checking' | 'success' | 'error' | 'warning';

	interface CheckItem {
		id: string;
		label: string;
		description?: string;
		status: CheckStatus;
		error?: string;
		canProceed?: boolean; // 即使失败也可以继续
	}

	interface Props {
		open: boolean;
		onClose: () => void;
		network: NetworkConfig;
		namespace: string;
		onConfirm: () => Promise<void>;
		onCancel: () => void;
	}

	let {
		open = $bindable(false),
		onClose,
		network,
		namespace,
		onConfirm,
		onCancel
	}: Props = $props();

	let checks = $state<CheckItem[]>([]);
	let currentCheckIndex = $state(0);
	let isChecking = $state(false);
	let allChecksPassed = $state(false);
	let canProceed = $state(false);
	let isConfirming = $state(false);

	// 初始化检查项
	$effect(() => {
		if (open) {
			initializeChecks();
		}
	});

	function initializeChecks() {
		// 模拟检查项 - 实际使用时会从 validators 传入
		checks = [
			{
				id: 'rpc-availability',
				label: 'RPC 可用性检查',
				description: '检查 RPC 端点是否可访问',
				status: 'pending'
			},
			{
				id: 'chain-id',
				label: 'Chain ID 验证',
				description: '验证网络 Chain ID 是否正确',
				status: 'pending'
			},
			{
				id: 'wallet-compatibility',
				label: '钱包兼容性',
				description: '检查当前钱包是否支持该网络',
				status: 'pending',
				canProceed: true // 即使失败也可以继续
			},
			{
				id: 'network-conflict',
				label: '网络冲突检查',
				description: '检查是否与其他已启用网络冲突',
				status: 'pending'
			}
		];
		currentCheckIndex = 0;
		allChecksPassed = false;
		canProceed = false;
		isChecking = false;
	}

	// 开始检查
	async function startChecking() {
		isChecking = true;
		currentCheckIndex = 0;

		for (let i = 0; i < checks.length; i++) {
			currentCheckIndex = i;
			checks[i].status = 'checking';

			// 模拟异步检查
			await performCheck(checks[i]);

			// 如果检查失败且不能继续，停止
			if (checks[i].status === 'error' && !checks[i].canProceed) {
				isChecking = false;
				canProceed = false;
				return;
			}
		}

		isChecking = false;
		allChecksPassed = checks.every((c) => c.status === 'success');
		canProceed = checks.every((c) => c.status === 'success' || c.canProceed);
	}

	// 执行单个检查（模拟）
	async function performCheck(check: CheckItem) {
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// 模拟不同的检查结果
		if (check.id === 'rpc-availability') {
			check.status = 'success';
		} else if (check.id === 'chain-id') {
			check.status = 'success';
		} else if (check.id === 'wallet-compatibility') {
			// 模拟警告
			check.status = 'warning';
			check.error = '当前钱包可能不完全支持此网络，但您仍可继续';
		} else if (check.id === 'network-conflict') {
			check.status = 'success';
		}
	}

	// 确认启用
	async function handleConfirm() {
		isConfirming = true;
		try {
			await onConfirm();
			onClose();
		} catch (error) {
			console.error('Enable network failed:', error);
		} finally {
			isConfirming = false;
		}
	}

	// 取消
	function handleCancel() {
		onCancel();
		onClose();
	}

	// 获取状态图标
	function getStatusIcon(status: CheckStatus) {
		switch (status) {
			case 'pending':
				return '○';
			case 'checking':
				return '⟳';
			case 'success':
				return '✓';
			case 'error':
				return '✗';
			case 'warning':
				return '⚠';
			default:
				return '○';
		}
	}
</script>

<Modal {open} {onClose} title="启用网络 - {network.name}" size="md">
	<div class="checklist-content">
		<div class="network-info">
			<div class="info-row">
				<span class="info-label">网络名称:</span>
				<span class="info-value">{network.name}</span>
			</div>
			<div class="info-row">
				<span class="info-label">Chain ID:</span>
				<span class="info-value">{network.chainId}</span>
			</div>
			<div class="info-row">
				<span class="info-label">命名空间:</span>
				<span class="info-value">{namespace}</span>
			</div>
		</div>

		<div class="checklist">
			<h3 class="checklist-title">启用条件检查</h3>

			<div class="check-items">
				{#each checks as check, index (check.id)}
					<div
						class="check-item"
						class:active={currentCheckIndex === index && isChecking}
						class:completed={check.status === 'success' || check.status === 'warning'}
						class:failed={check.status === 'error'}
					>
						<div class="check-header">
							<div class="check-icon status-{check.status}">
								{getStatusIcon(check.status)}
							</div>
							<div class="check-info">
								<div class="check-label">{check.label}</div>
								{#if check.description}
									<div class="check-description">{check.description}</div>
								{/if}
							</div>
						</div>

						{#if check.error}
							<div class="check-error">{check.error}</div>
						{/if}

						{#if check.status === 'checking'}
							<div class="check-progress">
								<div class="progress-bar">
									<div class="progress-fill"></div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		{#if !isChecking && !canProceed && currentCheckIndex > 0}
			<div class="error-message">检查未通过，无法启用该网络</div>
		{/if}

		{#if canProceed && !allChecksPassed}
			<div class="warning-message">
				部分检查有警告，但您仍然可以继续启用该网络。请确认您了解可能的风险。
			</div>
		{/if}
	</div>

	{#snippet footer()}
		{#if !isChecking && currentCheckIndex === 0}
			<button class="btn btn-secondary" onclick={handleCancel}>取消</button>
			<button class="btn btn-primary" onclick={startChecking}>开始检查</button>
		{:else if isChecking}
			<button class="btn btn-secondary" disabled>检查中...</button>
		{:else if canProceed}
			<button class="btn btn-secondary" onclick={handleCancel} disabled={isConfirming}>
				取消
			</button>
			<button class="btn btn-primary" onclick={handleConfirm} disabled={isConfirming}>
				{isConfirming ? '启用中...' : '确认启用'}
			</button>
		{:else}
			<button class="btn btn-secondary" onclick={handleCancel}>关闭</button>
			<button class="btn btn-primary" onclick={initializeChecks}>重新检查</button>
		{/if}
	{/snippet}
</Modal>

<style>
	.checklist-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.network-info {
		padding: var(--space-4);
		background: var(--color-muted);
		border-radius: var(--radius);
		border: 1px solid var(--color-border);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) 0;
	}

	.info-row:not(:last-child) {
		border-bottom: 1px solid var(--color-border);
	}

	.info-label {
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
		font-weight: var(--font-medium);
	}

	.info-value {
		font-size: var(--text-sm);
		color: var(--color-foreground);
		font-weight: var(--font-semibold);
	}

	.checklist {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.checklist-title {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-heading-2);
	}

	.check-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.check-item {
		padding: var(--space-3);
		background: var(--color-background);
		border: 2px solid var(--color-border);
		border-radius: var(--radius);
		transition: all 200ms ease;
	}

	.check-item.active {
		border-color: var(--color-primary);
		background: var(--color-accent);
	}

	.check-item.completed {
		border-color: var(--color-success);
		background: rgba(34, 197, 94, 0.05);
	}

	.check-item.failed {
		border-color: var(--color-danger);
		background: rgba(239, 68, 68, 0.05);
	}

	.check-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
	}

	.check-icon {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		font-size: var(--text-base);
		font-weight: var(--font-bold);
		flex-shrink: 0;
	}

	.check-icon.status-pending {
		background: var(--color-muted);
		color: var(--color-muted-foreground);
	}

	.check-icon.status-checking {
		background: var(--color-primary);
		color: white;
		animation: spin 1s linear infinite;
	}

	.check-icon.status-success {
		background: var(--color-success);
		color: white;
	}

	.check-icon.status-error {
		background: var(--color-danger);
		color: white;
	}

	.check-icon.status-warning {
		background: var(--color-warning);
		color: white;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.check-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.check-label {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--color-foreground);
	}

	.check-description {
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
	}

	.check-error {
		margin-top: var(--space-2);
		margin-left: calc(24px + var(--space-3));
		padding: var(--space-2);
		background: rgba(239, 68, 68, 0.1);
		border-left: 3px solid var(--color-danger);
		border-radius: var(--radius-sm);
		font-size: var(--text-xs);
		color: var(--color-danger);
	}

	.check-progress {
		margin-top: var(--space-2);
		margin-left: calc(24px + var(--space-3));
	}

	.progress-bar {
		height: 4px;
		background: var(--color-muted);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		animation: progress 1.5s ease-in-out infinite;
	}

	@keyframes progress {
		0% {
			width: 0%;
		}
		50% {
			width: 70%;
		}
		100% {
			width: 100%;
		}
	}

	.error-message {
		padding: var(--space-3);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
		color: var(--color-danger);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.warning-message {
		padding: var(--space-3);
		background: rgba(234, 179, 8, 0.1);
		border: 1px solid var(--color-warning);
		border-radius: var(--radius);
		color: var(--color-warning);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.btn {
		padding: var(--space-2) var(--space-4);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 150ms ease;
		border: 1px solid;
	}

	.btn-primary {
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border-color: var(--color-primary);
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-secondary {
		background: transparent;
		color: var(--color-foreground);
		border-color: var(--color-border);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--color-muted);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
