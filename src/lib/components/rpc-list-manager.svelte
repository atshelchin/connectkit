<script lang="ts">
	import { validateRpcUrl, getLatencyStatus } from '$lib/utils/rpc-validator.js';
	import type { RpcEndpoint } from '$lib/stores/network-config.svelte';

	interface Props {
		rpcEndpoints: RpcEndpoint[];
		onChange: (endpoints: RpcEndpoint[]) => void;
		autoValidateOnInit?: boolean;
		expectedChainId?: number;
	}

	let { rpcEndpoints, onChange, autoValidateOnInit = false, expectedChainId }: Props = $props();

	let newRpcUrl = $state('');
	let validatingAll = $state(false);
	let errorMessage = $state('');
	let hasInitialized = $state(false);

	// 自动验证所有 RPC（可选）
	$effect(() => {
		if (autoValidateOnInit && rpcEndpoints.length > 0 && !hasInitialized) {
			hasInitialized = true;
			setTimeout(() => {
				validateAllRpcs();
			}, 0);
		}
	});

	// 验证所有 RPC
	async function validateAllRpcs() {
		validatingAll = true;
		errorMessage = '';

		const results = await Promise.all(
			rpcEndpoints.map((rpc) => validateRpcUrl(rpc.url, 8000, expectedChainId))
		);

		// 创建新数组而不是修改现有元素
		const updated = rpcEndpoints.map((rpc, index) => ({
			...rpc,
			isAvailable: results[index].isValid,
			latency: results[index].latency,
			lastChecked: new Date()
		}));

		// 如果有任何验证失败，显示第一个错误
		const firstError = results.find((r) => !r.isValid);
		if (firstError?.error) {
			errorMessage = firstError.error;
		}

		onChange(updated);
		validatingAll = false;
	}

	// 验证单个 RPC
	async function validateSingleRpc(index: number) {
		const rpc = rpcEndpoints[index];
		const result = await validateRpcUrl(rpc.url, 8000, expectedChainId);

		// 创建新数组而不是修改索引
		const updated = rpcEndpoints.map((r, i) =>
			i === index
				? {
						...r,
						isAvailable: result.isValid,
						latency: result.latency,
						lastChecked: new Date()
					}
				: r
		);

		// 显示错误信息
		if (!result.isValid && result.error) {
			errorMessage = result.error;
			setTimeout(() => {
				errorMessage = '';
			}, 5000);
		}

		onChange(updated);
	}

	// 设置为主 RPC
	function setPrimaryRpc(index: number) {
		const updated = rpcEndpoints.map((rpc, i) => ({
			...rpc,
			isPrimary: i === index
		}));
		onChange(updated);
	}

	// 删除 RPC
	function removeRpc(index: number) {
		if (rpcEndpoints.length <= 1) {
			errorMessage = '至少需要保留一个 RPC 端点';
			return;
		}

		const wasPrimary = rpcEndpoints[index].isPrimary;
		let updated = rpcEndpoints.filter((_, i) => i !== index);

		// 如果删除的是主 RPC，设置第一个为主 RPC
		if (wasPrimary && updated.length > 0) {
			updated[0].isPrimary = true;
		}

		onChange(updated);
		errorMessage = '';
	}

	// 添加新 RPC
	async function addNewRpc() {
		if (!newRpcUrl.trim()) {
			errorMessage = '请输入 RPC URL';
			return;
		}

		// 检查是否重复
		if (rpcEndpoints.some((r) => r.url === newRpcUrl.trim())) {
			errorMessage = '该 RPC URL 已存在';
			return;
		}

		errorMessage = '';
		const newRpc: RpcEndpoint = {
			url: newRpcUrl.trim(),
			isPrimary: rpcEndpoints.length === 0 // 如果是第一个，设为主 RPC
		};

		// 验证新 RPC
		const result = await validateRpcUrl(newRpc.url, 8000, expectedChainId);
		newRpc.isAvailable = result.isValid;
		newRpc.latency = result.latency;
		newRpc.lastChecked = new Date();

		// 如果验证失败，显示错误但仍然允许添加
		if (!result.isValid && result.error) {
			errorMessage = result.error;
		}

		onChange([...rpcEndpoints, newRpc]);

		// 只有在验证成功时才清空输入框
		if (result.isValid) {
			newRpcUrl = '';
		}
	}
</script>

<div class="rpc-list-manager-section">
	<!-- 标题和验证状态 -->
	<div class="section-header">
		<h3 class="section-title">RPC 端点列表</h3>
		{#if validatingAll}
			<span class="validating-badge">验证中...</span>
		{/if}
	</div>

	<!-- RPC 列表 -->
	<div class="rpc-list">
		{#each rpcEndpoints as rpc, index (rpc.url)}
			<div class="rpc-item">
				<!-- 主 RPC 选择 -->
				<label class="radio-label">
					<input
						type="radio"
						name="primary-rpc"
						checked={rpc.isPrimary}
						onchange={() => setPrimaryRpc(index)}
					/>
					<span class="radio-custom"></span>
				</label>

				<!-- RPC 信息 -->
				<div class="rpc-info">
					<div class="rpc-url">{rpc.url}</div>
					<div class="rpc-status">
						{#if rpc.isAvailable === undefined}
							<span class="status-badge status-unknown">检测中...</span>
						{:else if rpc.isAvailable}
							<span class="status-badge status-available">✓ 可用</span>
							{#if rpc.latency}
								{@const status = getLatencyStatus(rpc.latency)}
								<span class="latency" style="color: {status.color}">
									延迟：{rpc.latency}ms ({status.label})
								</span>
							{/if}
						{:else}
							<span class="status-badge status-unavailable">⚠️ 不可用</span>
						{/if}
					</div>
				</div>

				<!-- 操作按钮 -->
				<div class="rpc-actions">
					{#if !rpc.isPrimary}
						<button class="action-btn btn-secondary" onclick={() => setPrimaryRpc(index)}>
							设为主
						</button>
					{/if}
					<button class="action-btn btn-secondary" onclick={() => validateSingleRpc(index)}>
						测试
					</button>
					<button class="action-btn btn-danger" onclick={() => removeRpc(index)}>删除</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- 添加新 RPC -->
	<div class="add-rpc-form">
		<input
			type="text"
			class="rpc-input"
			placeholder="https://rpc.example.com"
			bind:value={newRpcUrl}
			onkeydown={(e) => e.key === 'Enter' && addNewRpc()}
		/>
		<button class="action-btn btn-primary" onclick={addNewRpc}>+ 添加 RPC</button>
	</div>

	<!-- 错误信息 -->
	{#if errorMessage}
		<div class="error-message">{errorMessage}</div>
	{/if}
</div>

<style>
	.rpc-list-manager-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-heading-2);
	}

	.validating-badge {
		font-size: var(--text-sm);
		color: var(--color-primary);
		font-weight: var(--font-medium);
	}

	.rpc-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-height: 300px;
		overflow-y: auto;
		padding: var(--space-1);
	}

	.rpc-item {
		display: flex;
		align-items: flex-start;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-panel-1);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		transition: all 150ms ease;
	}

	.rpc-item:hover {
		background: var(--color-panel-2);
		border-color: var(--color-border-hover, var(--color-border));
	}

	.radio-label {
		display: flex;
		align-items: center;
		cursor: pointer;
		flex-shrink: 0;
		margin-top: var(--space-1);
	}

	.radio-label input[type='radio'] {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.radio-custom {
		width: 18px;
		height: 18px;
		border: 2px solid var(--color-border);
		border-radius: 50%;
		position: relative;
		transition: all 150ms ease;
	}

	.radio-label input[type='radio']:checked + .radio-custom {
		border-color: var(--color-primary);
	}

	.radio-label input[type='radio']:checked + .radio-custom::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10px;
		height: 10px;
		background: var(--color-primary);
		border-radius: 50%;
	}

	.rpc-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1-5);
	}

	.rpc-url {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
		word-break: break-all;
	}

	.rpc-status {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex-wrap: wrap;
	}

	.status-badge {
		font-size: var(--text-xs);
		padding: var(--space-0-5) var(--space-2);
		border-radius: var(--radius-sm);
		font-weight: var(--font-medium);
	}

	.status-available {
		background: rgba(34, 197, 94, 0.1);
		color: var(--color-success);
	}

	.status-unavailable {
		background: rgba(239, 68, 68, 0.1);
		color: var(--color-danger);
	}

	.status-unknown {
		background: var(--color-muted);
		color: var(--color-muted-foreground);
	}

	.latency {
		font-size: var(--text-xs);
		font-weight: var(--font-medium);
	}

	.rpc-actions {
		display: flex;
		gap: var(--space-1-5);
		flex-shrink: 0;
	}

	.action-btn {
		padding: var(--space-1-5) var(--space-2-5);
		font-size: var(--text-xs);
		font-weight: var(--font-medium);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all 150ms ease;
		border: 1px solid;
		white-space: nowrap;
	}

	.btn-primary {
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border-color: var(--color-primary);
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-secondary {
		background: transparent;
		color: var(--color-foreground);
		border-color: var(--color-border);
	}

	.btn-secondary:hover {
		background: var(--color-muted);
	}

	.btn-danger {
		background: transparent;
		color: var(--color-danger);
		border-color: var(--color-danger);
	}

	.btn-danger:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	.add-rpc-form {
		display: flex;
		gap: var(--space-2);
	}

	.rpc-input {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
		transition: all 150ms ease;
	}

	.rpc-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-ring);
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

	@media (max-width: 640px) {
		.rpc-item {
			flex-direction: column;
			gap: var(--space-2);
		}

		.rpc-actions {
			width: 100%;
			justify-content: flex-end;
		}

		.add-rpc-form {
			flex-direction: column;
		}
	}
</style>
