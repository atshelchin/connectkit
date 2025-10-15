<script lang="ts">
	import Modal from './modal.svelte';
	import RpcListManager from './rpc-list-manager.svelte';
	import type { RpcEndpoint } from '$lib/stores/network-config.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		networkName: string;
		chainId: number;
		rpcEndpoints: RpcEndpoint[];
		blockExplorer?: string;
		onSave: (rpcEndpoints: RpcEndpoint[], blockExplorer?: string) => Promise<void>;
	}

	let {
		open = $bindable(false),
		onClose,
		networkName,
		chainId,
		rpcEndpoints: initialRpcEndpoints,
		blockExplorer: initialBlockExplorer,
		onSave
	}: Props = $props();

	// 本地状态
	let rpcEndpoints = $state<RpcEndpoint[]>([]);
	let blockExplorer = $state('');
	let saving = $state(false);
	let errorMessage = $state('');
	let hasInitialized = $state(false);

	// 监听 open 状态，重新初始化数据
	$effect(() => {
		if (open && !hasInitialized) {
			// 深拷贝初始数据
			rpcEndpoints = initialRpcEndpoints.map((r) => ({ ...r }));
			blockExplorer = initialBlockExplorer || '';
			errorMessage = '';
			hasInitialized = true;
		} else if (!open) {
			// Modal 关闭时重置标志
			hasInitialized = false;
		}
	});

	// 处理 RPC 列表变化
	function handleRpcChange(updatedEndpoints: RpcEndpoint[]) {
		rpcEndpoints = updatedEndpoints;
	}

	// 保存配置
	async function handleSave() {
		// 验证：至少有一个可用的 RPC
		const hasAvailableRpc = rpcEndpoints.some((r) => r.isAvailable);
		if (!hasAvailableRpc) {
			errorMessage = '至少需要一个可用的 RPC 端点';
			return;
		}

		// 验证：主 RPC 必须可用
		const primaryRpc = rpcEndpoints.find((r) => r.isPrimary);
		if (!primaryRpc?.isAvailable) {
			errorMessage = '主 RPC 必须是可用状态';
			return;
		}

		saving = true;
		errorMessage = '';

		try {
			await onSave(rpcEndpoints, blockExplorer || undefined);
			onClose();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : '保存失败';
		} finally {
			saving = false;
		}
	}
</script>

<Modal {open} {onClose} title="修改 RPC - {networkName}" size="md">
	<div class="rpc-edit-content">
		<!-- RPC 端点列表 -->
		<RpcListManager {rpcEndpoints} onChange={handleRpcChange} expectedChainId={chainId} />

		<!-- 区块浏览器 -->
		<div class="section">
			<h3 class="section-title">区块浏览器 URL</h3>
			<input
				type="text"
				class="input-full"
				placeholder="https://etherscan.io"
				bind:value={blockExplorer}
			/>
			<p class="input-hint">可选，用于在浏览器中查看交易和地址</p>
		</div>

		<!-- 错误信息 -->
		{#if errorMessage}
			<div class="error-message">{errorMessage}</div>
		{/if}
	</div>

	{#snippet footer()}
		<button class="btn btn-secondary" onclick={onClose} disabled={saving}>取消</button>
		<button class="btn btn-primary" onclick={handleSave} disabled={saving}>
			{saving ? '保存中...' : '保存'}
		</button>
	{/snippet}
</Modal>

<style>
	.rpc-edit-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.section-title {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-heading-2);
	}

	.input-full {
		width: 100%;
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
		transition: all 150ms ease;
	}

	.input-full:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-ring);
	}

	.input-hint {
		margin: 0;
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
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

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
