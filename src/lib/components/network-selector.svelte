<script lang="ts">
	import ChainIcon from './chain-icon.svelte';
	import RpcEditModal from './rpc-edit-modal.svelte';
	import NetworkManagementModal from './network-management-modal.svelte';
	import {
		networkConfigStore,
		type NetworkConfig,
		type RpcEndpoint
	} from '$lib/stores/network-config.svelte';
	import type { StoredNetworkConfig } from '$lib/stores/network-config.svelte';

	interface Props {
		// 必填
		namespace: string;
		chainId?: number;
		onChainSwitch?: (chainId: number) => void;

		// 初始化配置（可选）
		defaultEnabledChainIds?: number[];

		// 功能开关
		allowRpcEdit?: boolean;
		allowCustomNetworks?: boolean;
		allowNetworkManagement?: boolean;

		// 回调
		onNetworkConfigChange?: (config: StoredNetworkConfig) => void;
	}

	let {
		namespace,
		chainId = 1,
		onChainSwitch,
		defaultEnabledChainIds,
		allowRpcEdit = true,
		allowCustomNetworks = true,
		allowNetworkManagement = true,
		onNetworkConfigChange
	}: Props = $props();

	// 初始化命名空间
	if (typeof window !== 'undefined') {
		networkConfigStore.initializeNamespace(namespace, defaultEnabledChainIds);
	}

	// 响应式：从 store 获取启用的网络列表
	let enabledNetworks = $derived(networkConfigStore.getEnabledNetworks(namespace));
	let allNetworks = $derived(networkConfigStore.getAllNetworks());
	let enabledChainIds = $derived(enabledNetworks.map((n) => n.chainId));
	let currentNetwork = $derived(networkConfigStore.getNetwork(chainId));

	// Network dropdown state
	let showNetworkDropdown = $state(false);
	let dropdownPosition = $state<'above' | 'below'>('below');
	let dropdownStyle = $state('');
	let networkButtonRef: HTMLButtonElement;

	// Modal states
	let showRpcEditModal = $state(false);
	let showNetworkManagementModal = $state(false);

	// Calculate dropdown position based on available space
	function calculateDropdownPosition() {
		if (!networkButtonRef) return;

		const rect = networkButtonRef.getBoundingClientRect();
		// 计算内容高度：网络列表 + 操作按钮区域
		const networkListHeight = enabledNetworks.length * 40;
		const actionsHeight = allowRpcEdit || allowNetworkManagement ? 100 : 0;
		const dropdownHeight = Math.min(networkListHeight + actionsHeight + 16, 400);
		const dropdownWidth = 240;

		const viewportHeight = window.visualViewport?.height || window.innerHeight;
		const viewportWidth = window.visualViewport?.width || window.innerWidth;

		const spaceBelow = viewportHeight - rect.bottom;
		const spaceAbove = rect.top;
		const spaceRight = viewportWidth - rect.left;
		const spaceLeft = rect.right;

		let useAbove = false;
		let verticalPos = '';

		if (spaceBelow >= dropdownHeight) {
			verticalPos = `top: ${rect.bottom + 8}px;`;
		} else if (spaceAbove >= dropdownHeight) {
			useAbove = true;
			verticalPos = `bottom: ${viewportHeight - rect.top + 8}px;`;
		} else {
			if (spaceAbove > spaceBelow) {
				useAbove = true;
				verticalPos = `top: 8px; max-height: ${rect.top - 16}px;`;
			} else {
				verticalPos = `top: ${rect.bottom + 8}px; max-height: ${spaceBelow - 16}px;`;
			}
		}

		let horizontalPos = '';
		if (spaceRight >= dropdownWidth) {
			horizontalPos = `left: ${rect.left}px; min-width: ${Math.min(dropdownWidth, spaceRight - 8)}px;`;
		} else if (spaceLeft >= dropdownWidth) {
			horizontalPos = `right: ${viewportWidth - rect.right}px; min-width: ${Math.min(dropdownWidth, spaceLeft - 8)}px;`;
		} else {
			horizontalPos = `left: 8px; right: 8px;`;
		}

		dropdownPosition = useAbove ? 'above' : 'below';
		dropdownStyle = `${verticalPos} ${horizontalPos}`;
	}

	// Handle network selection
	function selectNetwork(networkChainId: number) {
		console.log('[NetworkSelector] User selected network with chainId:', networkChainId);
		console.log('[NetworkSelector] Current chainId:', chainId);

		if (networkChainId !== chainId) {
			console.log('[NetworkSelector] Triggering chain switch...');
			networkConfigStore.setCurrentNetwork(namespace, networkChainId);
			onChainSwitch?.(networkChainId);
		} else {
			console.log('[NetworkSelector] Already on selected chain, no switch needed');
		}
		showNetworkDropdown = false;
	}

	// Toggle dropdown and calculate position
	function toggleNetworkDropdown() {
		showNetworkDropdown = !showNetworkDropdown;
		if (showNetworkDropdown) {
			requestAnimationFrame(() => {
				calculateDropdownPosition();
			});
		}
	}

	// Click outside to close dropdown
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.network-selector') && !target.closest('.network-dropdown')) {
			showNetworkDropdown = false;
		}
	}

	// Handle viewport resize (important for mobile)
	function handleViewportChange() {
		if (showNetworkDropdown) {
			calculateDropdownPosition();
		}
	}

	// 打开修改 RPC Modal
	function openRpcEditModal() {
		showNetworkDropdown = false;
		showRpcEditModal = true;
	}

	// 打开网络管理 Modal
	function openNetworkManagementModal() {
		showNetworkDropdown = false;
		showNetworkManagementModal = true;
	}

	// 保存 RPC 配置
	async function handleRpcSave(rpcEndpoints: RpcEndpoint[], blockExplorer?: string) {
		networkConfigStore.updateNetworkRpc(chainId, rpcEndpoints, blockExplorer);
		onNetworkConfigChange?.(networkConfigStore.getConfig());
	}

	// 启用/禁用网络
	async function handleNetworkToggle(toggleChainId: number, enabled: boolean): Promise<boolean> {
		const success = networkConfigStore.toggleNetwork(namespace, toggleChainId, enabled);
		if (success) {
			onNetworkConfigChange?.(networkConfigStore.getConfig());
		}
		return success;
	}

	// 添加自定义网络
	async function handleNetworkAdd(network: NetworkConfig) {
		networkConfigStore.addOrUpdateCustomNetwork(network);
		// 自动启用新添加的网络
		networkConfigStore.toggleNetwork(namespace, network.chainId, true);
		onNetworkConfigChange?.(networkConfigStore.getConfig());
	}

	// 编辑网络
	async function handleNetworkEdit(network: NetworkConfig) {
		networkConfigStore.updateNetwork(network);
		onNetworkConfigChange?.(networkConfigStore.getConfig());
	}

	// 删除自定义网络
	async function handleNetworkRemove(removeChainId: number) {
		networkConfigStore.removeCustomNetwork(removeChainId);
		onNetworkConfigChange?.(networkConfigStore.getConfig());
	}

	$effect(() => {
		if (showNetworkDropdown) {
			document.addEventListener('click', handleClickOutside);
			window.visualViewport?.addEventListener('resize', handleViewportChange);
			window.visualViewport?.addEventListener('scroll', handleViewportChange);

			return () => {
				document.removeEventListener('click', handleClickOutside);
				window.visualViewport?.removeEventListener('resize', handleViewportChange);
				window.visualViewport?.removeEventListener('scroll', handleViewportChange);
			};
		}
	});
</script>

<div class="network-selector">
	<button
		bind:this={networkButtonRef}
		class="chain-badge"
		onclick={toggleNetworkDropdown}
		title="切换网络"
		class:active={showNetworkDropdown}
	>
		<ChainIcon {chainId} size="sm" />
		<svg class="dropdown-arrow" width="8" height="8" viewBox="0 0 8 8" fill="none">
			<path
				d="M2 3L4 5L6 3"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	{#if showNetworkDropdown}
		<div
			class="network-dropdown"
			class:dropdown-above={dropdownPosition === 'above'}
			style={dropdownStyle}
		>
			<!-- 网络列表 -->
			<div class="dropdown-content">
				{#each enabledNetworks as network (network.chainId)}
					<button
						class="network-option"
						class:selected={network.chainId === chainId}
						onclick={() => selectNetwork(network.chainId)}
					>
						<ChainIcon chainId={network.chainId} size="sm" />
						<span class="network-name">{network.name}</span>
						{#if network.chainId === chainId}
							<svg class="check-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path
									d="M11 4L5.5 9.5L3 7"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{/if}
					</button>
				{/each}
			</div>

			<!-- 操作按钮区域 -->
			{#if allowRpcEdit || allowNetworkManagement}
				<div class="network-actions">
					{#if allowRpcEdit}
						<button class="action-button action-button-primary" onclick={openRpcEditModal}>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path
									d="M3 13h10M7.5 3.5l5 5L6 15H3v-3l6.5-6.5z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
							<span>修改 RPC</span>
						</button>
					{/if}

					{#if allowNetworkManagement}
						<button
							class="action-button action-button-secondary"
							onclick={openNetworkManagementModal}
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<path
									d="M8 3v10M3 8h10"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								/>
							</svg>
							<span>感兴趣的网络不在列表中？</span>
						</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- RPC 编辑 Modal -->
{#if currentNetwork && showRpcEditModal}
	<RpcEditModal
		bind:open={showRpcEditModal}
		onClose={() => (showRpcEditModal = false)}
		networkName={currentNetwork.name}
		chainId={currentNetwork.chainId}
		rpcEndpoints={currentNetwork.rpcEndpoints}
		blockExplorer={currentNetwork.blockExplorer}
		onSave={handleRpcSave}
	/>
{/if}

<!-- 网络管理 Modal -->
{#if showNetworkManagementModal}
	<NetworkManagementModal
		bind:open={showNetworkManagementModal}
		onClose={() => (showNetworkManagementModal = false)}
		{namespace}
		{allNetworks}
		{enabledChainIds}
		onNetworkToggle={handleNetworkToggle}
		onNetworkAdd={handleNetworkAdd}
		onNetworkEdit={handleNetworkEdit}
		onNetworkRemove={handleNetworkRemove}
		{allowCustomNetworks}
	/>
{/if}

<style>
	.network-selector {
		position: relative;
	}

	.chain-badge {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3);
		background: var(--color-panel-1);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 150ms ease;
		min-width: 60px;
		height: auto;
	}

	.chain-badge:hover {
		background: var(--color-muted);
		border-color: var(--color-border-hover, var(--color-border));
	}

	.chain-badge.active {
		background: var(--color-muted);
		border-color: var(--color-primary);
		z-index: 1001;
	}

	.dropdown-arrow {
		color: var(--color-muted-foreground);
		transition: transform 150ms ease;
	}

	.chain-badge.active .dropdown-arrow {
		transform: rotate(180deg);
	}

	/* Network dropdown */
	.network-dropdown {
		position: fixed;
		min-width: 240px;
		max-width: calc(100vw - 16px);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		animation: slideDown 200ms ease;
		z-index: 9999;
		overflow: hidden;
		-webkit-overflow-scrolling: touch;
		transform: translateZ(0);
		will-change: transform, opacity;
	}

	.network-dropdown.dropdown-above {
		animation: slideUp 200ms ease;
	}

	@supports (-webkit-touch-callout: none) {
		.network-dropdown {
			position: fixed;
			transform: translate3d(0, 0, 0);
		}
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-content {
		padding: var(--space-2);
		max-height: 320px;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
	}

	.network-option {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 150ms ease;
		text-align: left;
		position: relative;
	}

	.network-option:hover {
		background: var(--color-muted);
	}

	.network-option.selected {
		background: var(--color-primary-bg, rgba(59, 130, 246, 0.1));
		color: var(--color-primary);
	}

	.network-name {
		flex: 1;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
	}

	.network-option.selected .network-name {
		color: var(--color-primary);
	}

	.check-icon {
		color: var(--color-primary);
		flex-shrink: 0;
	}

	/* 操作按钮区域 */
	.network-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-2);
		border-top: 1px solid var(--color-panel-border-2);
		background: var(--color-panel-1);
	}

	.action-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		width: 100%;
		padding: var(--space-2-5) var(--space-3);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 150ms ease;
		border: 1px solid;
		background: transparent;
	}

	.action-button svg {
		flex-shrink: 0;
	}

	.action-button-primary {
		color: var(--color-foreground);
		border-color: var(--color-border);
	}

	.action-button-primary:hover {
		background: var(--color-muted);
		border-color: var(--color-border-hover, var(--color-border));
	}

	.action-button-primary svg {
		color: var(--color-primary);
	}

	.action-button-secondary {
		color: var(--color-muted-foreground);
		border: 1px dashed var(--color-border);
		font-size: var(--text-xs);
	}

	.action-button-secondary:hover {
		border-style: solid;
		color: var(--color-primary);
		background: var(--color-panel-accent);
	}

	.action-button-secondary svg {
		color: var(--color-primary);
	}

	@media (max-width: 640px) {
		.network-dropdown {
			min-width: calc(100vw - 32px);
		}

		.action-button {
			font-size: var(--text-xs);
			padding: var(--space-2) var(--space-2-5);
		}
	}
</style>
