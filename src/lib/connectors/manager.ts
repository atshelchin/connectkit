import type {
	ConnectionManager,
	ConnectionState,
	Connector,
	PersistedConnection
} from './types.js';

const STORAGE_KEY = 'connectkit.connection';
const CONNECTION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

/**
 * 连接管理器实现
 * 负责管理所有连接器，处理连接状态，以及持久化
 */
export class WalletConnectionManager implements ConnectionManager {
	private connectors: Map<string, Connector> = new Map();
	private state: ConnectionState = {
		isConnected: false,
		isConnecting: false
	};
	private listeners = new Set<(state: ConnectionState) => void>();

	constructor(connectors: Connector[] = []) {
		// 注册连接器
		connectors.forEach((connector) => {
			this.registerConnector(connector);
		});
	}

	/**
	 * 注册连接器
	 */
	registerConnector(connector: Connector): void {
		this.connectors.set(connector.id, connector);

		// 设置连接器事件监听
		connector.on('connect', ({ address, chainId }) => {
			this.updateState({
				isConnected: true,
				isConnecting: false,
				address,
				chainId,
				connector,
				error: undefined
			});
			this.persistConnection();
		});

		connector.on('disconnect', () => {
			if (this.state.connector === connector) {
				this.updateState({
					isConnected: false,
					isConnecting: false,
					address: undefined,
					chainId: undefined,
					connector: undefined,
					error: undefined
				});
				this.clearPersistedConnection();
			}
		});

		connector.on('chainChanged', (chainId) => {
			if (this.state.connector === connector) {
				this.updateState({
					...this.state,
					chainId
				});
				this.persistConnection();
			}
		});

		connector.on('accountsChanged', (accounts) => {
			if (this.state.connector === connector) {
				if (accounts.length > 0) {
					this.updateState({
						...this.state,
						address: accounts[0]
					});
					this.persistConnection();
				} else {
					// 账户清空，断开连接
					connector.disconnect();
				}
			}
		});

		connector.on('error', (error) => {
			if (this.state.connector === connector || this.state.isConnecting) {
				this.updateState({
					...this.state,
					error,
					isConnecting: false
				});
			}
		});
	}

	/**
	 * 获取所有连接器
	 */
	getConnectors(): Connector[] {
		return Array.from(this.connectors.values());
	}

	/**
	 * 通过 ID 获取连接器
	 */
	getConnector(id: string): Connector | undefined {
		return this.connectors.get(id);
	}

	/**
	 * 连接钱包
	 */
	async connect(connector: Connector, chainId?: number): Promise<void> {
		// 如果已有连接，先断开
		if (this.state.connector && this.state.connector !== connector) {
			await this.state.connector.disconnect();
		}

		this.updateState({
			...this.state,
			isConnecting: true,
			error: undefined
		});

		try {
			const result = await connector.connect(chainId);

			// 连接成功，状态会通过事件更新
			this.updateState({
				isConnected: true,
				isConnecting: false,
				address: result.address,
				chainId: result.chainId,
				connector,
				error: undefined
			});

			this.persistConnection();
		} catch (error) {
			this.updateState({
				...this.state,
				isConnecting: false,
				error: error as Error
			});
			throw error;
		}
	}

	/**
	 * 断开连接
	 */
	async disconnect(): Promise<void> {
		if (this.state.connector) {
			// 立即清除持久化信息
			this.clearPersistedConnection();
			await this.state.connector.disconnect();
			// 状态会通过事件更新
		}
	}

	/**
	 * 自动连接（从本地存储恢复）
	 */
	async autoConnect(): Promise<boolean> {
		const persisted = this.getPersistedConnection();
		console.log('[Manager] autoConnect - persisted connection:', persisted);

		if (!persisted) {
			console.log('[Manager] No persisted connection found');
			return false;
		}

		// 检查连接是否过期
		if (Date.now() - persisted.timestamp > CONNECTION_TIMEOUT) {
			console.log('[Manager] Connection expired, clearing');
			this.clearPersistedConnection();
			return false;
		}

		// 查找对应的连接器
		const connector = this.connectors.get(persisted.connectorId);
		console.log('[Manager] Looking for connector:', persisted.connectorId, 'Found:', !!connector);
		console.log('[Manager] Available connectors:', Array.from(this.connectors.keys()));

		if (!connector) {
			console.log('[Manager] Connector not found, clearing persisted connection');
			this.clearPersistedConnection();
			return false;
		}

		// 检查连接器是否已授权
		const isAuthorized = await connector.isAuthorized();
		console.log('[Manager] Connector authorized:', isAuthorized);

		if (!isAuthorized) {
			console.log('[Manager] Connector not authorized, clearing persisted connection');
			this.clearPersistedConnection();
			return false;
		}

		try {
			// 尝试重新连接
			console.log('[Manager] Attempting to reconnect...');
			await this.connect(connector, persisted.chainId);
			console.log('[Manager] Reconnection successful');
			return true;
		} catch (error) {
			console.log('[Manager] Reconnection failed:', error);
			this.clearPersistedConnection();
			return false;
		}
	}

	/**
	 * 获取当前状态
	 */
	getState(): ConnectionState {
		return { ...this.state };
	}

	/**
	 * 订阅状态变化
	 */
	subscribe(listener: (state: ConnectionState) => void): () => void {
		this.listeners.add(listener);

		// 立即调用一次，传递当前状态
		listener(this.getState());

		// 返回取消订阅函数
		return () => {
			this.listeners.delete(listener);
		};
	}

	/**
	 * 更新状态并通知监听器
	 */
	private updateState(newState: ConnectionState): void {
		this.state = newState;

		// 通知所有监听器
		this.listeners.forEach((listener) => {
			listener(this.getState());
		});
	}

	/**
	 * 持久化连接信息
	 */
	private persistConnection(): void {
		// Check for browser environment
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return;
		}

		if (!this.state.isConnected || !this.state.connector || !this.state.address) {
			return;
		}

		const data: PersistedConnection = {
			connectorId: this.state.connector.id,
			connectorType: this.state.connector.type,
			address: this.state.address,
			chainId: this.state.chainId || 1,
			timestamp: Date.now()
		};

		// 如果是 EIP6963 连接器，保存额外信息
		if (this.state.connector.id.startsWith('eip6963:')) {
			const metadata = this.state.connector.getMetadata();
			interface EIP6963Metadata {
				rdns?: string;
			}
			const eipMetadata = metadata as unknown as EIP6963Metadata;
			if (eipMetadata.rdns) {
				data.eip6963Info = {
					rdns: eipMetadata.rdns,
					name: this.state.connector.name,
					icon: this.state.connector.icon || ''
				};
			}
		}

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
			console.log('[Manager] Connection persisted to localStorage:', data);
			// Verify it was saved
			const saved = localStorage.getItem(STORAGE_KEY);
			console.log('[Manager] Verified saved data:', saved);
		} catch (error) {
			console.warn('Failed to persist connection:', error);
		}
	}

	/**
	 * 获取持久化的连接信息
	 */
	private getPersistedConnection(): PersistedConnection | null {
		// Check for browser environment
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return null;
		}

		try {
			const data = localStorage.getItem(STORAGE_KEY);
			console.log('[Manager] Reading persisted connection, raw data:', data);
			if (data) {
				const parsed = JSON.parse(data);
				console.log('[Manager] Parsed persisted connection:', parsed);
				return parsed;
			}
		} catch (error) {
			console.warn('Failed to read persisted connection:', error);
		}
		return null;
	}

	/**
	 * 清除持久化的连接信息
	 */
	private clearPersistedConnection(): void {
		// Check for browser environment
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return;
		}

		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (error) {
			console.warn('Failed to clear persisted connection:', error);
		}
	}

	/**
	 * 切换链
	 */
	async switchChain(chainId: number): Promise<void> {
		if (!this.state.connector?.switchChain) {
			throw new Error('Current connector does not support chain switching');
		}

		await this.state.connector.switchChain(chainId);

		// 更新状态
		this.updateState({
			...this.state,
			chainId
		});

		this.persistConnection();
	}

	/**
	 * 获取当前钱包客户端
	 */
	async getWalletClient() {
		if (!this.state.connector) {
			throw new Error('No wallet connected');
		}

		return this.state.connector.getWalletClient();
	}
}
