import type { Address, Chain } from 'viem';
import type { WalletClient } from 'viem';

/**
 * 连接器类型枚举
 */
export enum ConnectorType {
	EIP6963 = 'eip6963',
	INJECTED = 'injected',
	COINBASE_SMART_WALLET = 'coinbase_smart_wallet',
	WALLET_CONNECT = 'wallet_connect'
}

/**
 * 连接器元数据
 */
export interface ConnectorMetadata {
	id: string;
	name: string;
	type: ConnectorType;
	icon?: string;
	downloadUrl?: string;
	rdns?: string; // Reverse domain name service identifier
}

/**
 * 连接状态
 */
export interface ConnectionState {
	isConnected: boolean;
	isConnecting: boolean;
	address?: Address;
	addresses?: Address[]; // Multiple addresses support
	chainId?: number;
	connector?: Connector;
	error?: Error;
}

/**
 * 持久化的连接信息
 */
export interface PersistedConnection {
	connectorId: string;
	connectorType: ConnectorType;
	address: Address;
	chainId: number;
	timestamp: number;
	// EIP6963 钱包的额外信息
	eip6963Info?: {
		rdns: string;
		name: string;
		icon: string;
	};
}

/**
 * SIWE Session
 */
export interface SIWESession {
	address: Address;
	chainId: number;
	signature: string;
	message: string;
	nonce: string;
	issuedAt: string;
	expirationTime: string;
	domain: string;
}

/**
 * 连接器事件
 */
export interface ConnectorEvents {
	connect: (args: { address: Address; addresses?: Address[]; chainId: number }) => void;
	disconnect: () => void;
	chainChanged: (chainId: number) => void;
	accountsChanged: (accounts: Address[]) => void;
	error: (error: Error) => void;
	display_uri?: (uri: string) => void;
}

/**
 * 连接器基础接口
 */
export interface Connector {
	readonly id: string;
	readonly name: string;
	readonly type: ConnectorType;
	readonly icon?: string;
	readonly ready: boolean;

	/**
	 * 连接钱包
	 * @param chainId 可选的链ID
	 * @returns 连接的地址和链ID
	 */
	connect(chainId?: number): Promise<{
		address: Address;
		addresses?: Address[]; // All available addresses
		chainId: number;
	}>;

	/**
	 * 断开连接
	 */
	disconnect(): Promise<void>;

	/**
	 * 获取账户地址
	 */
	getAccount(): Promise<Address>;

	/**
	 * 获取所有可用账户地址
	 */
	getAccounts?(): Promise<Address[]>;

	/**
	 * 切换账户
	 */
	switchAccount?(address: Address): Promise<void>;

	/**
	 * 获取链ID
	 */
	getChainId(): Promise<number>;

	/**
	 * 获取 WalletClient 实例
	 */
	getWalletClient(config?: { chainId?: number }): Promise<WalletClient>;

	/**
	 * 切换链
	 */
	switchChain?(chainId: number): Promise<void>;

	/**
	 * 签名消息
	 */
	signMessage?(message: string): Promise<string>;

	/**
	 * 签名 EIP-712 结构化消息
	 */
	signTypedData?(params: {
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
	}): Promise<string>;

	/**
	 * SIWE 认证
	 */
	signInWithEthereum?(params: {
		domain: string;
		nonce: string;
		expirationTime?: string;
	}): Promise<SIWESession>;

	/**
	 * 监听事件
	 */
	on<K extends keyof ConnectorEvents>(event: K, listener: ConnectorEvents[K]): void;

	/**
	 * 取消监听
	 */
	off<K extends keyof ConnectorEvents>(event: K, listener: ConnectorEvents[K]): void;

	/**
	 * 检查是否已连接
	 */
	isAuthorized(): Promise<boolean>;

	/**
	 * 设置连接器
	 */
	setup?(): Promise<void>;

	/**
	 * 获取元数据
	 */
	getMetadata(): ConnectorMetadata;
}

/**
 * 连接器配置选项
 */
export interface ConnectorOptions {
	chains?: Chain[];
	shimDisconnect?: boolean;
}

/**
 * EIP1193 Provider interface
 */
export interface EIP1193Provider {
	request(args: { method: string; params?: unknown[] }): Promise<unknown>;
	on(event: string, listener: (...args: unknown[]) => void): void;
	off?(event: string, listener: (...args: unknown[]) => void): void;
	removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

/**
 * EIP6963 Provider 详情
 */
export interface EIP6963ProviderDetail {
	info: {
		uuid: string;
		name: string;
		icon: string;
		rdns: string;
	};
	provider: EIP1193Provider;
}

/**
 * EIP6963 连接器选项
 */
export interface EIP6963ConnectorOptions extends ConnectorOptions {
	providerDetail: EIP6963ProviderDetail;
}

/**
 * WalletConnect 连接器选项
 */
export interface WalletConnectConnectorOptions extends ConnectorOptions {
	projectId: string;
	showQrModal?: boolean;
	qrModalOptions?: {
		theme?: 'dark' | 'light';
		themeVariables?: Record<string, string>;
	};
	metadata?: {
		name: string;
		description: string;
		url: string;
		icons: string[];
	};
}

/**
 * Coinbase Smart Wallet 连接器选项
 */
export interface CoinbaseConnectorOptions extends ConnectorOptions {
	appName?: string;
	appLogoUrl?: string;
	preference?: 'smartWalletOnly' | 'all';
}

/**
 * 注入式连接器选项
 */
export interface InjectedConnectorOptions extends ConnectorOptions {
	name?: string;
	shimDisconnect?: boolean;
}

/**
 * 连接管理器接口
 */
export interface ConnectionManager {
	/**
	 * 获取所有可用连接器
	 */
	getConnectors(): Connector[];

	/**
	 * 通过ID获取连接器
	 */
	getConnector(id: string): Connector | undefined;

	/**
	 * 连接钱包
	 */
	connect(connector: Connector): Promise<void>;

	/**
	 * 断开连接
	 */
	disconnect(): Promise<void>;

	/**
	 * 自动连接（从本地存储恢复）
	 */
	autoConnect(): Promise<boolean>;

	/**
	 * 获取当前连接状态
	 */
	getState(): ConnectionState;

	/**
	 * 订阅状态变化
	 */
	subscribe(listener: (state: ConnectionState) => void): () => void;
}
