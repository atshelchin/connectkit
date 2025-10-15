<script lang="ts">
	import Modal from './modal.svelte';
	import RpcListManager from './rpc-list-manager.svelte';
	import NetworkEnableChecklistModal from './network-enable-checklist-modal.svelte';
	import type { NetworkConfig, RpcEndpoint } from '$lib/stores/network-config.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		namespace: string;
		allNetworks: NetworkConfig[];
		enabledChainIds: number[];
		onNetworkToggle: (chainId: number, enabled: boolean) => Promise<boolean>;
		onNetworkAdd?: (network: NetworkConfig) => Promise<void>;
		onNetworkEdit?: (network: NetworkConfig) => Promise<void>;
		onNetworkRemove?: (chainId: number) => Promise<void>;
		allowCustomNetworks?: boolean;
	}

	let {
		open = $bindable(false),
		onClose,
		namespace,
		allNetworks,
		enabledChainIds,
		onNetworkToggle,
		onNetworkAdd,
		onNetworkEdit,
		onNetworkRemove,
		allowCustomNetworks = false
	}: Props = $props();

	// 本地状态
	let showAddForm = $state(false);
	let showEditForm = $state(false);
	let editingNetwork = $state<NetworkConfig | null>(null);
	let validatingNetwork = $state<number | null>(null);
	let validationMessage = $state('');

	// Checklist modal state
	let showChecklistModal = $state(false);
	let checklistNetwork = $state<NetworkConfig | null>(null);
	let checklistMode = $state<'enable' | 'add'>('enable');

	// 新网络表单
	let newNetwork = $state({
		name: '',
		chainId: '',
		symbol: '',
		rpcUrl: '',
		blockExplorer: ''
	});
	let editRpcEndpoints = $state<RpcEndpoint[]>([]);
	let formErrors = $state<Record<string, string>>({});
	let validatingForm = $state(false);
	let savingNetwork = $state(false);

	// 计算属性：预设网络和自定义网络
	let builtInNetworks = $derived(allNetworks.filter((n) => n.isBuiltIn));
	let customNetworks = $derived(allNetworks.filter((n) => n.isCustom));

	// 检查网络是否启用（使用 $derived 确保响应式）
	let isEnabledMap = $derived(Object.fromEntries(enabledChainIds.map((id) => [id, true])));

	function isEnabled(chainId: number): boolean {
		return isEnabledMap[chainId] === true;
	}

	// 处理网络启用/禁用
	async function handleToggle(chainId: number, wantsEnabled: boolean) {
		if (!wantsEnabled) {
			// 用户想禁用网络 - 直接执行
			const success = await onNetworkToggle(chainId, false);
			if (!success) {
				validationMessage = '无法禁用最后一个网络';
				setTimeout(() => {
					validationMessage = '';
				}, 3000);
			}
		} else {
			// 用户想启用网络 - 需要通过检查列表
			const network = allNetworks.find((n) => n.chainId === chainId);
			if (!network) return;

			checklistNetwork = network;
			checklistMode = 'enable';
			showChecklistModal = true;
		}
	}

	// Checklist 完成后的回调
	async function handleChecklistComplete() {
		if (!checklistNetwork) return;

		if (checklistMode === 'enable') {
			await onNetworkToggle(checklistNetwork.chainId, true);
		} else if (checklistMode === 'add') {
			await onNetworkAdd?.(checklistNetwork);
			// 重置表单
			cancelAdd();
		}

		showChecklistModal = false;
		checklistNetwork = null;
	}

	// Checklist 取消后的回调
	function handleChecklistCancel() {
		showChecklistModal = false;
		checklistNetwork = null;
	}

	// 验证表单
	// function validateForm(): boolean {
	// 	const errors: Record<string, string> = {};

	// 	if (!newNetwork.name.trim()) {
	// 		errors.name = '请输入网络名称';
	// 	}

	// 	const chainId = parseInt(newNetwork.chainId);
	// 	if (!newNetwork.chainId || isNaN(chainId) || chainId <= 0) {
	// 		errors.chainId = '请输入有效的 Chain ID';
	// 	} else if (allNetworks.some((n) => n.chainId === chainId)) {
	// 		errors.chainId = '该 Chain ID 已存在';
	// 	}

	// 	if (!newNetwork.symbol.trim()) {
	// 		errors.symbol = '请输入代币符号';
	// 	}

	// 	if (!newNetwork.rpcUrl.trim()) {
	// 		errors.rpcUrl = '请输入 RPC URL';
	// 	} else {
	// 		try {
	// 			new URL(newNetwork.rpcUrl);
	// 		} catch {
	// 			errors.rpcUrl = 'URL 格式错误';
	// 		}
	// 	}

	// 	if (newNetwork.blockExplorer.trim()) {
	// 		try {
	// 			new URL(newNetwork.blockExplorer);
	// 		} catch {
	// 			errors.blockExplorer = 'URL 格式错误';
	// 		}
	// 	}

	// 	formErrors = errors;
	// 	return Object.keys(errors).length === 0;
	// }

	// 添加新网络
	async function handleAddNetwork() {
		// 验证基本字段
		const errors: Record<string, string> = {};

		if (!newNetwork.name.trim()) {
			errors.name = '请输入网络名称';
		}

		const chainId = parseInt(newNetwork.chainId);
		if (!newNetwork.chainId || isNaN(chainId) || chainId <= 0) {
			errors.chainId = '请输入有效的 Chain ID';
		} else if (allNetworks.some((n) => n.chainId === chainId)) {
			errors.chainId = '该 Chain ID 已存在';
		}

		if (!newNetwork.symbol.trim()) {
			errors.symbol = '请输入代币符号';
		}

		// 验证 RPC
		if (editRpcEndpoints.length === 0) {
			errors.rpc = '至少需要一个 RPC 端点';
		} else {
			const hasAvailableRpc = editRpcEndpoints.some((r) => r.isAvailable);
			if (!hasAvailableRpc) {
				errors.rpc = '至少需要一个可用的 RPC 端点';
			}

			const primaryRpc = editRpcEndpoints.find((r) => r.isPrimary);
			if (!primaryRpc?.isAvailable) {
				errors.rpc = '主 RPC 必须是可用状态';
			}
		}

		formErrors = errors;
		if (Object.keys(errors).length > 0) return;

		// 构建网络配置
		const network: NetworkConfig = {
			chainId: parseInt(newNetwork.chainId),
			name: newNetwork.name.trim(),
			symbol: newNetwork.symbol.trim().toUpperCase(),
			rpcEndpoints: editRpcEndpoints,
			blockExplorer: newNetwork.blockExplorer.trim() || undefined,
			isCustom: true,
			isBuiltIn: false
		};

		// 显示检查列表以验证网络
		checklistNetwork = network;
		checklistMode = 'add';
		showChecklistModal = true;
	}

	// 删除自定义网络
	async function handleRemoveNetwork(chainId: number) {
		if (confirm('确定要删除这个自定义网络吗？')) {
			await onNetworkRemove?.(chainId);
		}
	}

	// 编辑网络 RPC
	function handleEditNetwork(network: NetworkConfig) {
		editingNetwork = network;
		// 填充表单数据
		newNetwork = {
			name: network.name,
			chainId: network.chainId.toString(),
			symbol: network.symbol,
			rpcUrl: '',
			blockExplorer: network.blockExplorer || ''
		};
		// 深拷贝 RPC 端点列表
		editRpcEndpoints = network.rpcEndpoints.map((r) => ({ ...r }));
		formErrors = {};
		showEditForm = true;
	}

	// 处理 RPC 列表变化
	function handleRpcChange(updatedEndpoints: RpcEndpoint[]) {
		editRpcEndpoints = updatedEndpoints;
	}

	// 保存编辑的网络
	async function handleSaveEdit() {
		// 验证基本字段
		const errors: Record<string, string> = {};
		if (!newNetwork.name.trim()) errors.name = '请输入网络名称';
		if (!newNetwork.symbol.trim()) errors.symbol = '请输入代币符号';

		// 验证 RPC
		if (editRpcEndpoints.length === 0) {
			errors.rpc = '至少需要一个 RPC 端点';
		} else {
			const hasAvailableRpc = editRpcEndpoints.some((r) => r.isAvailable);
			if (!hasAvailableRpc) {
				errors.rpc = '至少需要一个可用的 RPC 端点';
			}

			const primaryRpc = editRpcEndpoints.find((r) => r.isPrimary);
			if (!primaryRpc?.isAvailable) {
				errors.rpc = '主 RPC 必须是可用状态';
			}
		}

		formErrors = errors;
		if (Object.keys(errors).length > 0) return;

		savingNetwork = true;

		try {
			if (!editingNetwork) return;

			// 更新网络配置
			const updatedNetwork: NetworkConfig = {
				...editingNetwork,
				name: newNetwork.name.trim(),
				symbol: newNetwork.symbol.trim().toUpperCase(),
				rpcEndpoints: editRpcEndpoints,
				blockExplorer: newNetwork.blockExplorer.trim() || undefined
			};

			await onNetworkEdit?.(updatedNetwork);

			// 重置表单
			resetEditForm();
		} catch (error) {
			formErrors = {
				...formErrors,
				general: error instanceof Error ? error.message : '保存失败'
			};
		} finally {
			savingNetwork = false;
		}
	}

	// 重置编辑表单
	function resetEditForm() {
		showEditForm = false;
		editingNetwork = null;
		newNetwork = {
			name: '',
			chainId: '',
			symbol: '',
			rpcUrl: '',
			blockExplorer: ''
		};
		editRpcEndpoints = [];
		formErrors = {};
	}

	// 取消添加
	function cancelAdd() {
		showAddForm = false;
		newNetwork = {
			name: '',
			chainId: '',
			symbol: '',
			rpcUrl: '',
			blockExplorer: ''
		};
		editRpcEndpoints = [];
		formErrors = {};
	}

	// 开始添加新网络
	function startAddNetwork() {
		if (!allowCustomNetworks) {
			validationMessage = '当前页面不支持添加自定义网络';
			setTimeout(() => {
				validationMessage = '';
			}, 3000);
			return;
		}

		showAddForm = true;
		newNetwork = {
			name: '',
			chainId: '',
			symbol: '',
			rpcUrl: '',
			blockExplorer: ''
		};
		editRpcEndpoints = [];
		formErrors = {};
	}
</script>

<Modal {open} {onClose} title="网络管理 ({namespace})" size="lg">
	<div class="network-management">
		{#if !showAddForm && !showEditForm}
			<!-- 预设网络 -->
			<div class="section">
				<h3 class="section-title">预设网络</h3>
				<div class="network-list">
					{#each builtInNetworks as network (network.chainId)}
						{@const validating = validatingNetwork === network.chainId}
						{@const enabled = isEnabled(network.chainId)}
						<div class="network-item">
							<label class="checkbox-label">
								<input
									type="checkbox"
									checked={enabled}
									disabled={validating}
									onclick={(e) => {
										e.preventDefault();
										if (!validating) handleToggle(network.chainId, !enabled);
									}}
								/>
								<span class="checkbox-custom"></span>
							</label>

							<div class="network-info">
								<div class="network-name">{network.name}</div>
								<div class="network-meta">Chain ID: {network.chainId} • {network.symbol}</div>
							</div>

							<div class="network-actions">
								{#if validating}
									<span class="status-validating">验证中...</span>
								{:else if enabled}
									<span class="status-enabled">已启用</span>
								{/if}
								<button class="action-btn btn-edit" onclick={() => handleEditNetwork(network)}>
									编辑 RPC
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- 自定义网络 -->
			{#if customNetworks.length > 0}
				<div class="section">
					<h3 class="section-title">自定义网络</h3>
					<div class="network-list">
						{#each customNetworks as network (network.chainId)}
							{@const validating = validatingNetwork === network.chainId}
							{@const enabled = isEnabled(network.chainId)}
							<div class="network-item">
								<label class="checkbox-label">
									<input
										type="checkbox"
										checked={enabled}
										disabled={validating}
										onclick={(e) => {
											e.preventDefault();
											if (!validating) handleToggle(network.chainId, !enabled);
										}}
									/>
									<span class="checkbox-custom"></span>
								</label>

								<div class="network-info">
									<div class="network-name">{network.name}</div>
									<div class="network-meta">Chain ID: {network.chainId} • {network.symbol}</div>
								</div>

								<div class="network-actions">
									{#if validating}
										<span class="status-validating">验证中...</span>
									{:else if enabled}
										<span class="status-enabled">已启用</span>
									{/if}
									<button class="action-btn btn-edit" onclick={() => handleEditNetwork(network)}>
										编辑
									</button>
									<button
										class="action-btn btn-danger-text"
										onclick={() => handleRemoveNetwork(network.chainId)}
									>
										删除
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 验证消息 -->
			{#if validationMessage}
				<div class="validation-message">{validationMessage}</div>
			{/if}

			<!-- 添加网络按钮 - 始终显示 -->
			<button class="btn-add-network" onclick={startAddNetwork}> + 添加自定义网络 </button>
		{:else if showEditForm}
			<!-- 编辑网络表单 -->
			<div class="add-network-form">
				<h3 class="form-title">编辑网络 - {editingNetwork?.name}</h3>

				<div class="form-group">
					<label for="network-name" class="form-label">网络名称 *</label>
					<input
						id="network-name"
						type="text"
						class="form-input"
						placeholder="My Custom Network"
						bind:value={newNetwork.name}
						class:error={formErrors.name}
					/>
					{#if formErrors.name}
						<span class="form-error">{formErrors.name}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="chain-id" class="form-label">Chain ID</label>
					<input
						id="chain-id"
						type="number"
						class="form-input"
						placeholder="1234"
						bind:value={newNetwork.chainId}
						disabled
						class:error={formErrors.chainId}
					/>
					<span class="input-hint">Chain ID 不可修改</span>
				</div>

				<div class="form-group">
					<label for="symbol" class="form-label">代币符号 *</label>
					<input
						id="symbol"
						type="text"
						class="form-input"
						placeholder="MCN"
						bind:value={newNetwork.symbol}
						class:error={formErrors.symbol}
					/>
					{#if formErrors.symbol}
						<span class="form-error">{formErrors.symbol}</span>
					{/if}
				</div>

				<!-- RPC 端点列表 -->
				<div class="form-group">
					<RpcListManager
						rpcEndpoints={editRpcEndpoints}
						onChange={handleRpcChange}
						expectedChainId={editingNetwork?.chainId}
					/>
					{#if formErrors.rpc}
						<span class="form-error">{formErrors.rpc}</span>
					{/if}
				</div>
				<!-- <div class="form-group">
					<label for="rpc-url" class="form-label">RPC URL *</label>
					<input
						id="rpc-url"
						type="url"
						class="form-input"
						placeholder="https://rpc.example.com"
						bind:value={newNetwork.rpcUrl}
						class:error={formErrors.rpcUrl}
					/>
					{#if formErrors.rpcUrl}
						<span class="form-error">{formErrors.rpcUrl}</span>
					{/if}
				</div> -->

				<div class="form-group">
					<label for="block-explorer" class="form-label">区块浏览器 URL (可选)</label>
					<input
						id="block-explorer"
						type="url"
						class="form-input"
						placeholder="https://scan.example.com"
						bind:value={newNetwork.blockExplorer}
						class:error={formErrors.blockExplorer}
					/>
					{#if formErrors.blockExplorer}
						<span class="form-error">{formErrors.blockExplorer}</span>
					{/if}
				</div>

				{#if formErrors.general}
					<div class="form-error-general">{formErrors.general}</div>
				{/if}

				<div class="form-actions">
					<button class="btn btn-secondary" onclick={resetEditForm} disabled={savingNetwork}>
						取消
					</button>
					<button
						class="btn btn-primary"
						onclick={handleSaveEdit}
						disabled={savingNetwork || validatingForm}
					>
						{#if validatingForm}
							验证中...
						{:else if savingNetwork}
							保存中...
						{:else}
							保存
						{/if}
					</button>
				</div>
			</div>
		{:else}
			<!-- 添加网络表单 -->
			<div class="add-network-form">
				<h3 class="form-title">添加新网络</h3>

				<div class="form-group">
					<label for="network-name-add" class="form-label">网络名称 *</label>
					<input
						id="network-name-add"
						type="text"
						class="form-input"
						placeholder="My Custom Network"
						bind:value={newNetwork.name}
						class:error={formErrors.name}
					/>
					{#if formErrors.name}
						<span class="form-error">{formErrors.name}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="chain-id-add" class="form-label">Chain ID *</label>
					<input
						id="chain-id-add"
						type="number"
						class="form-input"
						placeholder="1234"
						bind:value={newNetwork.chainId}
						class:error={formErrors.chainId}
					/>
					{#if formErrors.chainId}
						<span class="form-error">{formErrors.chainId}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="symbol-add" class="form-label">代币符号 *</label>
					<input
						id="symbol-add"
						type="text"
						class="form-input"
						placeholder="MCN"
						bind:value={newNetwork.symbol}
						class:error={formErrors.symbol}
					/>
					{#if formErrors.symbol}
						<span class="form-error">{formErrors.symbol}</span>
					{/if}
				</div>

				<!-- RPC 端点列表 -->
				<div class="form-group">
					<RpcListManager
						rpcEndpoints={editRpcEndpoints}
						onChange={handleRpcChange}
						expectedChainId={newNetwork.chainId ? parseInt(newNetwork.chainId) : undefined}
					/>
					{#if formErrors.rpc}
						<span class="form-error">{formErrors.rpc}</span>
					{/if}
				</div>

				<div class="form-group">
					<label for="block-explorer-add" class="form-label">区块浏览器 URL (可选)</label>
					<input
						id="block-explorer-add"
						type="url"
						class="form-input"
						placeholder="https://scan.example.com"
						bind:value={newNetwork.blockExplorer}
						class:error={formErrors.blockExplorer}
					/>
					{#if formErrors.blockExplorer}
						<span class="form-error">{formErrors.blockExplorer}</span>
					{/if}
				</div>

				{#if formErrors.general}
					<div class="form-error-general">{formErrors.general}</div>
				{/if}

				<div class="form-actions">
					<button class="btn btn-secondary" onclick={cancelAdd} disabled={savingNetwork}>
						取消
					</button>
					<button
						class="btn btn-primary"
						onclick={handleAddNetwork}
						disabled={savingNetwork || validatingForm}
					>
						{#if validatingForm}
							验证中...
						{:else if savingNetwork}
							添加中...
						{:else}
							添加并启用
						{/if}
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- {#snippet footer()}
		<button class="btn btn-primary" onclick={onClose}>完成</button>
	{/snippet} -->
</Modal>

<!-- 验证警告对话框 -->
<!-- {#if showValidationDialog}
	<Modal open={showValidationDialog} onClose={cancelValidation} title="确认操作" size="sm">
		<div class="validation-dialog">
			<p class="validation-warning">{validationMessage}</p>
			<p class="validation-question">是否继续启用？</p>
		</div>

		{#snippet footer()}
			<button class="btn btn-secondary" onclick={cancelValidation}>取消</button>
			<button class="btn btn-primary" onclick={confirmValidation}>确认启用</button>
		{/snippet}
	</Modal>
{/if} -->

<!-- 网络启用检查列表 -->
{#if showChecklistModal && checklistNetwork}
	<NetworkEnableChecklistModal
		bind:open={showChecklistModal}
		onClose={handleChecklistCancel}
		onConfirm={handleChecklistComplete}
		onCancel={handleChecklistCancel}
		network={checklistNetwork}
		{namespace}
	/>
{/if}

<style>
	.network-management {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		min-height: 300px;
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

	.network-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		max-height: 350px;
		overflow-y: auto;
	}

	.network-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-panel-1);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		transition: all 150ms ease;
	}

	.network-item:hover {
		background: var(--color-panel-2);
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		cursor: pointer;
		flex-shrink: 0;
	}

	.checkbox-label input[type='checkbox'] {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}

	.checkbox-custom {
		width: 20px;
		height: 20px;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-sm);
		position: relative;
		transition: all 150ms ease;
	}

	.checkbox-label input[type='checkbox']:checked + .checkbox-custom {
		background: var(--color-primary);
		border-color: var(--color-primary);
	}

	.checkbox-label input[type='checkbox']:checked + .checkbox-custom::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 6px;
		width: 5px;
		height: 10px;
		border: solid white;
		border-width: 0 2px 2px 0;
		transform: rotate(45deg);
	}

	.checkbox-label input[type='checkbox']:disabled + .checkbox-custom {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.network-info {
		flex: 1;
		min-width: 0;
	}

	.network-name {
		font-size: var(--text-sm);
		font-weight: var(--font-semibold);
		color: var(--color-foreground);
	}

	.network-meta {
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
		margin-top: var(--space-0-5);
	}

	.network-actions {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.status-enabled {
		font-size: var(--text-xs);
		color: var(--color-success);
		font-weight: var(--font-medium);
	}

	.status-validating {
		font-size: var(--text-xs);
		color: var(--color-primary);
		font-weight: var(--font-medium);
	}

	.action-btn {
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-xs);
		font-weight: var(--font-medium);
		border: none;
		background: transparent;
		cursor: pointer;
		transition: all 150ms ease;
		border-radius: var(--radius-sm);
	}

	.btn-danger-text {
		color: var(--color-danger);
	}

	.btn-danger-text:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	.validation-message {
		padding: var(--space-3);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
		color: var(--color-danger);
		font-size: var(--text-sm);
	}

	.btn-add-network {
		width: 100%;
		padding: var(--space-3);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-primary);
		background: transparent;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.btn-add-network:hover {
		border-style: solid;
		background: var(--color-panel-accent);
	}

	/* 添加网络表单 */
	.add-network-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.form-title {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-heading-1);
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-1-5);
	}

	.form-label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
	}

	.form-input {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
		transition: all 150ms ease;
	}

	.form-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px var(--color-ring);
	}

	.form-input.error {
		border-color: var(--color-danger);
	}

	.form-error {
		font-size: var(--text-xs);
		color: var(--color-danger);
	}

	.form-error-general {
		padding: var(--space-3);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--color-danger);
		border-radius: var(--radius);
		color: var(--color-danger);
		font-size: var(--text-sm);
	}

	.form-actions {
		display: flex;
		gap: var(--space-3);
		justify-content: flex-end;
		margin-top: var(--space-2);
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

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	@media (max-width: 640px) {
		.network-item {
			flex-wrap: wrap;
		}

		.network-actions {
			width: 100%;
			justify-content: flex-end;
		}
	}

	.btn-edit {
		color: var(--color-primary);
	}

	.btn-edit:hover {
		background: rgba(59, 130, 246, 0.1);
	}

	.input-hint {
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
		margin-top: var(--space-1);
	}
</style>
