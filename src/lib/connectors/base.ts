import { createWalletClient, custom, type Address, type Chain, type WalletClient } from 'viem';
import type {
	Connector,
	ConnectorEvents,
	ConnectorMetadata,
	ConnectorOptions,
	ConnectorType
} from './types.js';

/**
 * 连接器基类
 * 提供通用的事件处理和基础功能实现
 */
export abstract class BaseConnector implements Connector {
	abstract readonly id: string;
	abstract readonly name: string;
	abstract readonly type: ConnectorType;
	readonly icon?: string;

	protected chains: Chain[];
	protected options: ConnectorOptions;
	private listeners = new Map<keyof ConnectorEvents, Set<(...args: unknown[]) => void>>();

	constructor(options: ConnectorOptions = {}) {
		this.options = options;
		this.chains = options.chains || [];
	}

	/**
	 * 连接器是否准备就绪
	 */
	abstract get ready(): boolean;

	/**
	 * 连接钱包
	 */
	abstract connect(chainId?: number): Promise<{
		address: Address;
		chainId: number;
	}>;

	/**
	 * 断开连接
	 */
	abstract disconnect(): Promise<void>;

	/**
	 * 获取账户地址
	 */
	abstract getAccount(): Promise<Address>;

	/**
	 * 获取链 ID
	 */
	abstract getChainId(): Promise<number>;

	/**
	 * 获取 WalletClient 实例
	 */
	abstract getWalletClient(config?: { chainId?: number }): Promise<WalletClient>;

	/**
	 * 切换链
	 */
	async switchChain?(_chainId: number): Promise<void> {
		throw new Error(`switchChain not supported by this connector ${_chainId}`);
	}

	/**
	 * 检查是否已授权连接
	 */
	abstract isAuthorized(): Promise<boolean>;

	/**
	 * 设置连接器
	 */
	async setup?(): Promise<void> {
		// 可选实现
	}

	/**
	 * 获取元数据
	 */
	getMetadata(): ConnectorMetadata {
		return {
			id: this.id,
			name: this.name,
			type: this.type,
			icon: this.icon
		};
	}

	/**
	 * 监听事件
	 */
	on<K extends keyof ConnectorEvents>(event: K, listener: ConnectorEvents[K]): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)!.add(listener as (...args: unknown[]) => void);
	}

	/**
	 * 取消监听
	 */
	off<K extends keyof ConnectorEvents>(event: K, listener: ConnectorEvents[K]): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			listeners.delete(listener as (...args: unknown[]) => void);
		}
	}

	/**
	 * 触发事件
	 */
	protected emit<K extends keyof ConnectorEvents>(
		event: K,
		...args: Parameters<ConnectorEvents[K]>
	): void {
		const listeners = this.listeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => {
				listener(...args);
			});
		}
	}

	/**
	 * 获取支持的链
	 */
	protected getChain(chainId: number): Chain | undefined {
		return this.chains.find((chain) => chain.id === chainId);
	}

	/**
	 * 创建 WalletClient 辅助方法
	 */
	protected createWalletClient(provider: unknown, chain?: Chain, account?: Address): WalletClient {
		return createWalletClient({
			chain,
			account,
			transport: custom(provider as ReturnType<typeof window.ethereum>)
		});
	}

	/**
	 * 标准化链 ID
	 */
	protected normalizeChainId(chainId: string | number | bigint): number {
		if (typeof chainId === 'string') {
			// 处理十六进制字符串
			if (chainId.startsWith('0x')) {
				return parseInt(chainId, 16);
			}
			return parseInt(chainId, 10);
		}
		if (typeof chainId === 'bigint') {
			return Number(chainId);
		}
		return chainId;
	}
}
