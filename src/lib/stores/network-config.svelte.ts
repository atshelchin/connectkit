import { browser } from '$app/environment';

const STORAGE_KEY = 'connectkit-network-config';

// RPC 端点配置
export interface RpcEndpoint {
	url: string;
	isPrimary: boolean;
	isAvailable?: boolean;
	latency?: number;
	lastChecked?: Date;
}

// 网络配置
export interface NetworkConfig {
	chainId: number;
	name: string;
	symbol: string;
	rpcEndpoints: RpcEndpoint[];
	blockExplorer?: string;
	iconUrl?: string;
	isCustom: boolean;
	isBuiltIn: boolean;
	createdAt?: string;
	updatedAt?: string;
}

// 存储的网络配置
export interface StoredNetworkConfig {
	networks: Record<string, NetworkConfig>;
	namespaces: Record<
		string,
		{
			enabledChainIds: number[];
			currentChainId?: number; // 当前选中的网络
		}
	>;
}

// 内置预设网络
const BUILT_IN_NETWORKS: NetworkConfig[] = [
	{
		chainId: 1,
		name: 'Ethereum',
		symbol: 'ETH',
		rpcEndpoints: [
			{ url: 'https://eth.llamarpc.com', isPrimary: true },
			{ url: 'https://rpc.ankr.com/eth', isPrimary: false }
		],
		blockExplorer: 'https://etherscan.io',
		isBuiltIn: true,
		isCustom: false
	},
	{
		chainId: 137,
		name: 'Polygon',
		symbol: 'MATIC',
		rpcEndpoints: [
			{ url: 'https://polygon-rpc.com', isPrimary: true },
			{ url: 'https://rpc.ankr.com/polygon', isPrimary: false }
		],
		blockExplorer: 'https://polygonscan.com',
		isBuiltIn: true,
		isCustom: false
	},
	{
		chainId: 10,
		name: 'Optimism',
		symbol: 'ETH',
		rpcEndpoints: [
			{ url: 'https://mainnet.optimism.io', isPrimary: true },
			{ url: 'https://rpc.ankr.com/optimism', isPrimary: false }
		],
		blockExplorer: 'https://optimistic.etherscan.io',
		isBuiltIn: true,
		isCustom: false
	},
	{
		chainId: 42161,
		name: 'Arbitrum',
		symbol: 'ETH',
		rpcEndpoints: [
			{ url: 'https://arb1.arbitrum.io/rpc', isPrimary: true },
			{ url: 'https://rpc.ankr.com/arbitrum', isPrimary: false }
		],
		blockExplorer: 'https://arbiscan.io',
		isBuiltIn: true,
		isCustom: false
	},
	{
		chainId: 56,
		name: 'BNB Chain',
		symbol: 'BNB',
		rpcEndpoints: [
			{ url: 'https://bsc-dataseed.binance.org', isPrimary: true },
			{ url: 'https://rpc.ankr.com/bsc', isPrimary: false }
		],
		blockExplorer: 'https://bscscan.com',
		isBuiltIn: true,
		isCustom: false
	},
	{
		chainId: 43114,
		name: 'Avalanche',
		symbol: 'AVAX',
		rpcEndpoints: [
			{ url: 'https://api.avax.network/ext/bc/C/rpc', isPrimary: true },
			{ url: 'https://rpc.ankr.com/avalanche', isPrimary: false }
		],
		blockExplorer: 'https://snowtrace.io',
		isBuiltIn: true,
		isCustom: false
	},
	{
		chainId: 8453,
		name: 'Base',
		symbol: 'ETH',
		rpcEndpoints: [
			{ url: 'https://mainnet.base.org', isPrimary: true },
			{ url: 'https://base.llamarpc.com', isPrimary: false }
		],
		blockExplorer: 'https://basescan.org',
		isBuiltIn: true,
		isCustom: false
	},
	{
		chainId: 648,
		name: 'Endurance',
		symbol: 'ACE',
		rpcEndpoints: [{ url: 'https://rpc-endurance.fusionist.io', isPrimary: true }],
		blockExplorer: 'https://explorer.endurance.fusionist.io',
		isBuiltIn: true,
		isCustom: false
	}
];

class NetworkConfigStore {
	private config = $state<StoredNetworkConfig>({
		networks: {},
		namespaces: {}
	});

	constructor() {
		if (browser) {
			this.load();
		}
	}

	// 从 localStorage 加载
	private load() {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				this.config = JSON.parse(stored);
				// 确保所有内置网络都存在（处理版本更新）
				this.mergeBuiltInNetworks();
			} else {
				// 初始化默认网络
				this.initializeDefaults();
			}
		} catch (error) {
			console.error('[NetworkConfigStore] Failed to load config:', error);
			this.initializeDefaults();
		}
	}

	// 保存到 localStorage 并触发响应式更新
	private save() {
		if (!browser) return;
		try {
			// 触发 Svelte 5 响应式更新：创建新对象
			this.config = { ...this.config };
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
		} catch (error) {
			console.error('[NetworkConfigStore] Failed to save config:', error);
		}
	}

	// 初始化默认网络
	private initializeDefaults() {
		BUILT_IN_NETWORKS.forEach((network) => {
			this.config.networks[network.chainId] = { ...network };
		});
		this.save();
	}

	// 合并内置网络（处理版本更新）
	// 注意：如果用户已经添加了相同 chainId 的自定义网络，保留用户的自定义网络，跳过预设网络
	private mergeBuiltInNetworks() {
		let hasChanges = false;
		BUILT_IN_NETWORKS.forEach((network) => {
			const existing = this.config.networks[network.chainId];

			// 如果该 chainId 不存在，添加预设网络
			if (!existing) {
				this.config.networks[network.chainId] = { ...network };
				hasChanges = true;
			}
			// 如果已存在且是用户自定义的网络，保留用户的网络，不覆盖
			else if (existing.isCustom) {
				console.log(
					`[NetworkConfigStore] Skipping built-in network ${network.name} (chainId: ${network.chainId}) - user has custom network with same chainId`
				);
				// 不做任何操作，保留用户的自定义网络
			}
			// 如果已存在且是预设网络，可以选择更新（如果需要的话）
			// 目前不更新已存在的预设网络，避免覆盖用户的修改
		});
		if (hasChanges) {
			this.save();
		}
	}

	// 获取某个命名空间下的启用网络列表
	getEnabledNetworks(namespace: string): NetworkConfig[] {
		const enabledIds = this.config.namespaces[namespace]?.enabledChainIds || [];
		return enabledIds.map((id) => this.config.networks[id]).filter(Boolean);
	}

	// 获取所有网络（用于网络管理界面）
	getAllNetworks(): NetworkConfig[] {
		return Object.values(this.config.networks);
	}

	// 获取单个网络
	getNetwork(chainId: number): NetworkConfig | undefined {
		return this.config.networks[chainId];
	}

	// 更新网络的 RPC 配置
	updateNetworkRpc(chainId: number, rpcEndpoints: RpcEndpoint[], blockExplorer?: string) {
		const network = this.config.networks[chainId];
		if (!network) {
			console.warn('[NetworkConfigStore] Network not found:', chainId);
			return;
		}

		network.rpcEndpoints = rpcEndpoints;
		if (blockExplorer !== undefined) {
			network.blockExplorer = blockExplorer;
		}
		network.updatedAt = new Date().toISOString();

		this.save();
	}

	// 更新网络（保留 isBuiltIn 和 isCustom 标志）
	updateNetwork(network: Omit<NetworkConfig, 'isCustom' | 'isBuiltIn'>) {
		const existing = this.config.networks[network.chainId];

		if (!existing) {
			console.warn('[NetworkConfigStore] Cannot update non-existent network:', network.chainId);
			return;
		}

		this.config.networks[network.chainId] = {
			...network,
			isCustom: existing.isCustom,
			isBuiltIn: existing.isBuiltIn,
			createdAt: existing.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		this.save();
	}

	// 添加或更新自定义网络
	addOrUpdateCustomNetwork(network: Omit<NetworkConfig, 'isCustom' | 'isBuiltIn'>) {
		const existing = this.config.networks[network.chainId];

		this.config.networks[network.chainId] = {
			...network,
			isCustom: true,
			isBuiltIn: false,
			createdAt: existing?.createdAt || new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		this.save();
	}

	// 删除自定义网络
	removeCustomNetwork(chainId: number) {
		const network = this.config.networks[chainId];
		if (!network?.isCustom) {
			console.warn('[NetworkConfigStore] Cannot remove built-in network');
			return;
		}

		// 从所有命名空间中移除，并自动切换当前网络
		Object.keys(this.config.namespaces).forEach((ns) => {
			const namespace = this.config.namespaces[ns];
			const idx = namespace.enabledChainIds.indexOf(chainId);

			if (idx > -1) {
				namespace.enabledChainIds.splice(idx, 1);

				// 如果删除的是当前网络，切换到第一个启用的网络
				if (namespace.currentChainId === chainId) {
					namespace.currentChainId =
						namespace.enabledChainIds.length > 0 ? namespace.enabledChainIds[0] : undefined;
				}
			}
		});

		delete this.config.networks[chainId];
		this.save();
	}

	// 启用/禁用网络（命名空间级别）
	toggleNetwork(namespace: string, chainId: number, enabled: boolean): boolean {
		if (!this.config.namespaces[namespace]) {
			this.config.namespaces[namespace] = {
				enabledChainIds: [],
				currentChainId: undefined
			};
		}

		const ns = this.config.namespaces[namespace];
		const idx = ns.enabledChainIds.indexOf(chainId);

		if (enabled && idx === -1) {
			// 启用网络：创建新对象以触发响应式更新
			const newEnabledIds = [...ns.enabledChainIds, chainId];
			this.config.namespaces[namespace] = {
				...ns,
				enabledChainIds: newEnabledIds,
				currentChainId: newEnabledIds.length === 1 ? chainId : ns.currentChainId
			};
		} else if (!enabled && idx > -1) {
			// 防止禁用最后一个网络
			if (ns.enabledChainIds.length === 1) {
				console.warn('[NetworkConfigStore] Cannot disable the last enabled network');
				return false;
			}

			// 禁用网络：创建新对象以触发响应式更新
			const newEnabledIds = ns.enabledChainIds.filter((id) => id !== chainId);
			this.config.namespaces[namespace] = {
				...ns,
				enabledChainIds: newEnabledIds,
				currentChainId:
					ns.currentChainId === chainId
						? newEnabledIds.length > 0
							? newEnabledIds[0]
							: undefined
						: ns.currentChainId
			};
		}

		this.save();
		return true;
	}

	// 检查网络是否在命名空间中启用
	isNetworkEnabled(namespace: string, chainId: number): boolean {
		return this.config.namespaces[namespace]?.enabledChainIds.includes(chainId) || false;
	}

	// 设置当前网络
	setCurrentNetwork(namespace: string, chainId: number) {
		if (!this.config.namespaces[namespace]) {
			this.config.namespaces[namespace] = {
				enabledChainIds: [],
				currentChainId: chainId
			};
		} else {
			// 只允许设置为已启用的网络
			if (this.config.namespaces[namespace].enabledChainIds.includes(chainId)) {
				this.config.namespaces[namespace].currentChainId = chainId;
			} else {
				console.warn(
					`[NetworkConfigStore] Cannot set current network to disabled network: ${chainId}`
				);
				return;
			}
		}
		this.save();
	}

	// 获取当前网络
	getCurrentNetwork(namespace: string): NetworkConfig | null {
		const ns = this.config.namespaces[namespace];
		if (!ns || !ns.currentChainId) {
			return null;
		}
		return this.config.networks[ns.currentChainId] || null;
	}

	// 获取当前网络 ID
	getCurrentChainId(namespace: string): number | undefined {
		return this.config.namespaces[namespace]?.currentChainId;
	}

	// 获取完整配置（用于外部同步）
	getConfig(): StoredNetworkConfig {
		return this.config;
	}

	// 初始化命名空间（如果不存在，使用默认启用的网络）
	initializeNamespace(namespace: string, defaultChainIds?: number[]) {
		if (!this.config.namespaces[namespace]) {
			const enabledIds = defaultChainIds || [1, 137, 10, 42161, 56, 43114, 8453, 648];
			this.config.namespaces[namespace] = {
				enabledChainIds: enabledIds.filter((id) => this.config.networks[id]),
				currentChainId: enabledIds[0]
			};
			this.save();
		}
	}
}

export const networkConfigStore = new NetworkConfigStore();
