import type {
	ConnectionManager,
	ConnectionState,
	Connector,
	PersistedConnection
} from './types.js';
import type { Address } from 'viem';

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
		connector.on('connect', ({ address, addresses, chainId }) => {
			this.updateState({
				isConnected: true,
				isConnecting: false,
				address,
				addresses: addresses || [address],
				chainId,
				connector,
				error: undefined
			});
			this.persistConnection();
		});

		connector.on('disconnect', () => {
			console.log('[Manager] Received disconnect event from connector:', connector.name);
			console.trace('[Manager] Disconnect event stack trace');
			if (this.state.connector === connector) {
				console.log('[Manager] Clearing connection state due to disconnect event');
				this.updateState({
					isConnected: false,
					isConnecting: false,
					address: undefined,
					addresses: undefined,
					chainId: undefined,
					connector: undefined,
					error: undefined
				});
				this.clearPersistedConnection();
			}
		});

		connector.on('chainChanged', (chainId) => {
			console.log('[Manager] Received chainChanged event from connector:', chainId);
			if (this.state.connector === connector) {
				console.log('[Manager] Updating state with new chainId:', chainId);
				// Only update chainId, keep all other connection info
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
						address: accounts[0],
						addresses: accounts
					});
					this.persistConnection();
				} else {
					// 账户清空，断开连接
					connector.disconnect();
				}
			}
		});

		connector.on('error', (error) => {
			console.log('[Manager] Connector error:', error);
			// Only update error state, don't disconnect or clear connection info
			if (this.state.connector === connector || this.state.isConnecting) {
				this.updateState({
					...this.state,
					error,
					isConnecting: false
					// Keep all connection info (address, chainId, etc)
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
				addresses: result.addresses || [result.address],
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
	 * 切换账户
	 */
	async switchAccount(address: Address): Promise<void> {
		if (!this.state.connector) {
			throw new Error('No connector connected');
		}

		if (!this.state.connector.switchAccount) {
			throw new Error('Connector does not support account switching');
		}

		await this.state.connector.switchAccount(address);

		// Update state
		this.updateState({
			...this.state,
			address
		});

		this.persistConnection();
	}

	/**
	 * 切换网络
	 */
	async switchChain(chainId: number): Promise<void> {
		console.log('[Manager] switchChain called with chainId:', chainId);
		console.log('[Manager] Current connection state:', {
			isConnected: this.state.isConnected,
			address: this.state.address,
			chainId: this.state.chainId,
			connector: this.state.connector?.name
		});

		if (!this.state.connector) {
			console.error('[Manager] No connector in state, full state:', this.state);
			throw new Error('No connector connected');
		}

		if (!this.state.connector.switchChain) {
			throw new Error('Connector does not support chain switching');
		}

		try {
			console.log('[Manager] Attempting to switch chain via connector...');
			// Try to switch to the chain
			await this.state.connector.switchChain(chainId);
			console.log('[Manager] Chain switch successful to chainId:', chainId);
		} catch (error: unknown) {
			console.log('[Manager] Chain switch failed with error:', error);
			console.log('[Manager] State after error:', {
				isConnected: this.state.isConnected,
				address: this.state.address,
				chainId: this.state.chainId,
				connector: this.state.connector?.name
			});

			// CRITICAL: Preserve connection state when network switch fails
			// The wallet is still connected on the original chain
			console.log('[Manager] Chain switch failed, preserving connection state');

			// Make sure we maintain the current state
			const currentState = this.getState();
			if (currentState.isConnected && currentState.address) {
				console.log(
					'[Manager] Forcing state persistence with current chain:',
					currentState.chainId
				);
				// Force update to ensure UI doesn't lose connection info
				this.updateState(currentState);
				// Persist to localStorage to prevent any loss
				this.persistConnection();
			}

			// Check if it's a chain not added error
			const err = error as { code?: number; message?: string };

			// Format user-friendly error messages
			if (err.message?.includes('No wallet accounts')) {
				// No accounts on this network
				throw new Error(`该网络上没有可用的钱包账户`);
			} else if (err.code === 4902 || err.message?.includes('Unrecognized chain')) {
				console.log('[Manager] Chain not found in wallet');
				throw new Error(`钱包不支持该网络`);
			} else if (err.code === 4001 || err.message?.includes('User rejected')) {
				// User rejected
				throw new Error('已取消切换');
			} else {
				console.error('[Manager] Chain switch failed:', error);
				// Generic error
				throw new Error('网络切换失败');
			}
		}
	}

	/**
	 * 签名消息
	 */
	async signMessage(message: string): Promise<string> {
		if (!this.state.connector) {
			throw new Error('No connector connected');
		}

		if (!this.state.connector.signMessage) {
			// Fallback to wallet client
			const walletClient = await this.state.connector.getWalletClient();
			const signature = await walletClient.signMessage({
				account: this.state.address!,
				message
			});
			return signature;
		}

		return await this.state.connector.signMessage(message);
	}

	/**
	 * 签名 EIP-712 结构化消息
	 */
	async signTypedData(params: {
		domain: {
			name?: string;
			version?: string;
			chainId?: number;
			verifyingContract?: Address;
			salt?: string;
		};
		types: Record<string, Array<{ name: string; type: string }>>;
		primaryType: string;
		message: Record<string, unknown>;
	}): Promise<string> {
		if (!this.state.connector) {
			throw new Error('No connector connected');
		}

		if (!this.state.connector.signTypedData) {
			// Fallback to wallet client
			const walletClient = await this.state.connector.getWalletClient();
			const signature = await walletClient.signTypedData({
				account: this.state.address!,
				domain: {
					...params.domain,
					salt: params.domain.salt as `0x${string}` | undefined
				},
				types: params.types,
				primaryType: params.primaryType,
				message: params.message
			});
			return signature;
		}

		return await this.state.connector.signTypedData(params);
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
	 * 获取当前钱包客户端
	 */
	async getWalletClient() {
		if (!this.state.connector) {
			throw new Error('No wallet connected');
		}

		return this.state.connector.getWalletClient();
	}
}
