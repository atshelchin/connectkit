import type { Address, WalletClient } from 'viem';
import { createBaseAccountSDK } from '@base-org/account';
import { BaseConnector } from './base.js';
import { ConnectorType, type CoinbaseConnectorOptions } from './types.js';

/**
 * Coinbase Smart Wallet 连接器
 * 使用 Base Account SDK 实现智能钱包连接
 */
export class CoinbaseSmartWalletConnector extends BaseConnector {
	readonly id = 'coinbase';
	readonly name = 'Coinbase Smart Wallet';
	readonly type = ConnectorType.COINBASE_SMART_WALLET;
	readonly icon =
		'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzAwNTJGRiIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIwIDM0QzI3LjczMiAzNCAzNCAyNy43MzIgMzQgMjBDMzQgMTIuMjY4IDI3LjczMiA2IDIwIDZDMTIuMjY4IDYgNiAxMi4yNjggNiAyMEM2IDI3LjczMiAxMi4yNjcgMzQgMjAgMzRaTTIzLjUgMTdIMTYuNUMxNS42NzE2IDE3IDE1IDE3LjY3MTYgMTUgMTguNVYyMS41QzE1IDIyLjMyODQgMTUuNjcxNiAyMyAxNi41IDIzSDIzLjVDMjQuMzI4NCAyMyAyNSAyMi4zMjg0IDI1IDIxLjVWMTguNUMyNSAxNy42NzE2IDI0LjMyODQgMTcgMjMuNSAxN1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==';

	private sdk: ReturnType<typeof createBaseAccountSDK> | null = null;
	private provider: ReturnType<ReturnType<typeof createBaseAccountSDK>['getProvider']> | null =
		null;
	private coinbaseOptions: CoinbaseConnectorOptions;

	constructor(options: CoinbaseConnectorOptions) {
		super(options);
		this.coinbaseOptions = options;
	}

	/**
	 * 检查连接器是否准备就绪
	 */
	get ready(): boolean {
		// Base Account SDK 总是可用的
		return true;
	}

	/**
	 * 初始化 SDK 和 Provider
	 */
	private async initializeSDK() {
		if (this.provider) return;

		try {
			// 初始化 Base Account SDK
			this.sdk = createBaseAccountSDK({
				appName: this.coinbaseOptions.appName || 'ConnectKit',
				appLogoUrl: this.coinbaseOptions.appLogoUrl
			});

			// 获取 provider
			this.provider = this.sdk.getProvider();

			// 设置事件监听
			this.setupEventListeners();
		} catch (error) {
			console.error('Failed to initialize Base Account SDK:', error);
			throw new Error('Failed to initialize Coinbase Smart Wallet');
		}
	}

	/**
	 * 连接钱包
	 */
	async connect(chainId?: number): Promise<{
		address: Address;
		chainId: number;
	}> {
		try {
			await this.initializeSDK();

			if (!this.provider) {
				throw new Error('Failed to initialize provider');
			}
			console.log('coinbase connect ');

			// 请求账户访问权限
			const accounts = (await this.provider.request({
				method: 'eth_requestAccounts'
			})) as Address[];

			if (!accounts || accounts.length === 0) {
				throw new Error('No accounts found');
			}

			// 获取当前链 ID
			const currentChainId = await this.getChainId();

			// 如果指定了链 ID 且与当前不同，尝试切换
			if (chainId && chainId !== currentChainId) {
				await this.switchChain(chainId);
			}

			const address = accounts[0];
			const connectedChainId = chainId || currentChainId;

			// 触发连接事件
			this.emit('connect', { address, chainId: connectedChainId });

			return {
				address,
				chainId: connectedChainId
			};
		} catch (error) {
			this.emit('error', error as Error);
			throw error;
		}
	}

	/**
	 * 断开连接
	 */
	async disconnect(): Promise<void> {
		// Base Account SDK 不直接支持 disconnect
		// 但我们可以清理本地状态
		this.provider = null;
		this.sdk = null;

		this.emit('disconnect');
	}

	/**
	 * 获取当前账户
	 */
	async getAccount(): Promise<Address> {
		if (!this.provider) {
			await this.initializeSDK();
		}

		const accounts = (await this.provider!.request({
			method: 'eth_accounts'
		})) as Address[];

		if (!accounts || accounts.length === 0) {
			throw new Error('No accounts found');
		}

		return accounts[0];
	}

	/**
	 * 获取当前链 ID
	 */
	async getChainId(): Promise<number> {
		if (!this.provider) {
			await this.initializeSDK();
		}

		const chainId = await this.provider!.request({
			method: 'eth_chainId'
		});

		return this.normalizeChainId(chainId as string | number | bigint);
	}

	/**
	 * 获取 WalletClient 实例
	 */
	async getWalletClient(config?: { chainId?: number }): Promise<WalletClient> {
		if (!this.provider) {
			await this.initializeSDK();
		}

		const [address, chainId] = await Promise.all([this.getAccount(), this.getChainId()]);

		const chain = config?.chainId ? this.getChain(config.chainId) : this.getChain(chainId);

		return this.createWalletClient(this.provider, chain, address);
	}

	/**
	 * 切换链
	 */
	async switchChain(chainId: number): Promise<void> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}

		const chain = this.getChain(chainId);
		const hexChainId = `0x${chainId.toString(16)}`;

		try {
			// 尝试切换到目标链
			await this.provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: hexChainId }]
			});

			this.emit('chainChanged', chainId);
		} catch (error) {
			// 4902 表示链未添加到钱包
			const err = error as { code?: number; message?: string };
			if (err.code === 4902 && chain) {
				try {
					// 尝试添加链
					await this.provider.request({
						method: 'wallet_addEthereumChain',
						params: [
							{
								chainId: hexChainId,
								chainName: chain.name,
								nativeCurrency: chain.nativeCurrency,
								rpcUrls: chain.rpcUrls?.default?.http || [],
								blockExplorerUrls: chain.blockExplorers?.default?.url
									? [chain.blockExplorers.default.url]
									: []
							}
						]
					});

					this.emit('chainChanged', chainId);
				} catch (addError) {
					const err = new Error(
						addError instanceof Error ? addError.message : 'Failed to add chain'
					);
					this.emit('error', err);
					throw err;
				}
			} else {
				const err = new Error(error instanceof Error ? error.message : 'Failed to switch chain');
				this.emit('error', err);
				throw err;
			}
		}
	}

	/**
	 * 检查是否已授权
	 */
	async isAuthorized(): Promise<boolean> {
		try {
			if (!this.provider) {
				await this.initializeSDK();
			}

			const accounts = (await this.provider!.request({
				method: 'eth_accounts'
			})) as Address[];

			return accounts && accounts.length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * 设置事件监听
	 */
	private setupEventListeners(): void {
		if (!this.provider) return;

		// 注意：Base Account SDK 的 provider 可能不支持所有标准事件
		// 我们只监听真正需要的事件，避免重复触发

		// 断开连接事件
		this.provider.on('disconnect', (error: unknown) => {
			console.log('Base Account disconnected:', error);
			this.emit('disconnect');
		});

		// 账户变更事件
		this.provider.on('accountsChanged', (accounts: string[]) => {
			const addresses = accounts as Address[];
			if (addresses.length === 0) {
				this.emit('disconnect');
			} else {
				this.emit('accountsChanged', addresses);
			}
		});

		// 链变更事件
		this.provider.on('chainChanged', (chainId: string | number) => {
			const normalizedChainId = this.normalizeChainId(chainId);
			this.emit('chainChanged', normalizedChainId);
		});
	}

	/**
	 * 签名消息（示例方法）
	 */
	async signMessage(message: string, address?: Address): Promise<string> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}

		const account = address || (await this.getAccount());
		// Convert string to hex without Buffer (browser compatible)
		const encoder = new TextEncoder();
		const data = encoder.encode(message);
		const hexMessage =
			'0x' + Array.from(data, (byte) => byte.toString(16).padStart(2, '0')).join('');

		const signature = await this.provider.request({
			method: 'personal_sign',
			params: [hexMessage, account]
		});

		return signature as string;
	}

	/**
	 * 获取元数据
	 */
	getMetadata() {
		return {
			...super.getMetadata(),
			sdkVersion: 'base-account-sdk'
		};
	}
}

/**
 * 导出为 CoinbaseConnector 以保持兼容性
 */
export { CoinbaseSmartWalletConnector as CoinbaseConnector };
