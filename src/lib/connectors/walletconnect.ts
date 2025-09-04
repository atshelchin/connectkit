import type { Address, WalletClient } from 'viem';
import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { BaseConnector } from './base.js';
import { ConnectorType, type WalletConnectConnectorOptions } from './types.js';

type WalletConnectProvider = InstanceType<typeof EthereumProvider>;

/**
 * WalletConnect 连接器
 * 支持通过 WalletConnect 协议连接钱包
 */
export class WalletConnectConnector extends BaseConnector {
	readonly id = 'walletconnect';
	readonly name = 'WalletConnect';
	readonly type = ConnectorType.WALLET_CONNECT;
	readonly icon =
		'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzNCOTlGQyIvPgo8cGF0aCBkPSJNMTIuMiAxNC44QzE1LjMgMTEuNyAyMC4zIDExLjcgMjMuNSAxNC44TDIzLjkgMTUuMkMyNC4xIDE1LjQgMjQuMSAxNS43IDIzLjkgMTUuOUwyMi42IDE3LjJDMjIuNSAxNy4zIDIyLjMgMTcuMyAyMi4yIDE3LjJMMjEuNyAxNi43QzE5LjUgMTQuNSAxNi4xIDE0LjUgMTQgMTYuN0wxMy40IDE3LjNDMTMuMyAxNy40IDEzLjEgMTcuNCAxMyAxNy4zTDExLjcgMTZDMTEuNSAxNS44IDExLjUgMTUuNSAxMS43IDE1LjNMMTIuMiAxNC44Wk0yNS45IDE3LjJMMjcgMTguM0MyNy4yIDE4LjUgMjcuMiAxOC44IDI3IDE5TDIyLjEgMjMuOUMyMS45IDI0LjEgMjEuNiAyNC4xIDIxLjQgMjMuOUwxOCAyMC41QzE4IDIwLjQgMTcuOSAyMC40IDE3LjggMjAuNUwxNC40IDIzLjlDMTQuMiAyNC4xIDEzLjkgMjQuMSAxMy43IDIzLjlMOC44IDE5QzguNiAxOC44IDguNiAxOC41IDguOCAxOC4zTDkuOSAxNy4yQzEwLjEgMTcgMTAuNCAxNyAxMC42IDE3LjJMMTQgMjAuNkMxNC4xIDIwLjcgMTQuMiAyMC43IDE0LjMgMjAuNkwxNy43IDE3LjJDMTcuOSAxNyAxOC4yIDE3IDE4LjQgMTcuMkwyMS44IDIwLjZDMjEuOSAyMC43IDIyIDIwLjcgMjIuMSAyMC42TDI1LjUgMTcuMkMyNS43IDE3IDI2IDE3IDI1LjkgMTcuMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==';

	private provider: WalletConnectProvider | null = null;
	private uri?: string;

	constructor(private readonly wcOptions: WalletConnectConnectorOptions) {
		super(wcOptions);
	}

	/**
	 * 检查连接器是否准备就绪
	 */
	get ready(): boolean {
		return true; // WalletConnect 总是可用的
	}

	/**
	 * 获取 WalletConnect URI
	 */
	getUri(): string | undefined {
		return this.uri;
	}

	/**
	 * 初始化 Provider
	 */
	private async initializeProvider() {
		if (this.provider) return;

		// 获取支持的链 ID
		const chainIds = this.chains.map((chain) => chain.id);
		const defaultChainId = chainIds[0] || 1;

		// 创建 EthereumProvider
		this.provider = await EthereumProvider.init({
			projectId: this.wcOptions.projectId,
			chains: [defaultChainId],
			optionalChains: chainIds,
			showQrModal: false,
			qrModalOptions: this.wcOptions.qrModalOptions,
			metadata: this.wcOptions.metadata || {
				name: 'ConnectKit',
				description: 'Connect your wallet',
				url: typeof window !== 'undefined' ? window.location.origin : '',
				icons: ['https://walletconnect.org/walletconnect-logo.svg']
			}
		});

		// 设置事件监听
		this.setupEventListeners();
	}

	/**
	 * 连接钱包
	 */
	async connect(chainId?: number): Promise<{
		address: Address;
		chainId: number;
	}> {
		try {
			await this.initializeProvider();

			if (!this.provider) {
				throw new Error('Failed to initialize provider');
			}

			// 监听 URI 更新
			this.provider.on('display_uri', (uri: string) => {
				console.log('WalletConnect URI:', uri);
				this.uri = uri;
				this.emit('display_uri', uri);
			});

			// 启用 provider（触发连接流程）
			let accounts = (await this.provider.enable()) as Address[];

			// 获取当前链 ID
			let currentChainId = await this.getChainId();

			// 如果指定了链 ID 且与当前不同，尝试切换
			if (chainId && chainId !== currentChainId) {
				console.log('[WalletConnect] Switching to requested chain:', chainId);
				try {
					await this.switchChain(chainId);
					currentChainId = chainId;

					// After switching chain, get accounts again as they might have changed
					accounts = (await this.provider.request({
						method: 'eth_accounts'
					})) as Address[];

					// If still no accounts after switch, it means this network doesn't have accounts
					if (!accounts || accounts.length === 0) {
						console.warn(
							'[WalletConnect] No accounts on chain',
							chainId,
							'- staying on original chain'
						);
						// Try to switch back to original chain
						try {
							await this.switchChain(currentChainId);
							// Get accounts again on original chain
							accounts = (await this.provider.request({
								method: 'eth_accounts'
							})) as Address[];
						} catch (switchBackError) {
							console.error('[WalletConnect] Failed to switch back:', switchBackError);
						}
					}
				} catch (switchError) {
					console.warn('[WalletConnect] Failed to switch to requested chain:', switchError);
					// Continue with current chain
				}
			}

			// If still no accounts, try Ethereum mainnet as fallback
			if (!accounts || accounts.length === 0) {
				console.log('[WalletConnect] No accounts found, trying Ethereum mainnet as fallback');
				try {
					await this.switchChain(1); // Ethereum mainnet
					accounts = (await this.provider.request({
						method: 'eth_accounts'
					})) as Address[];
					currentChainId = 1;
				} catch (mainnetError) {
					console.error('[WalletConnect] Failed to switch to mainnet:', mainnetError);
				}
			}

			if (!accounts || accounts.length === 0) {
				throw new Error('No accounts found. Please ensure your wallet has at least one account.');
			}

			const address = accounts[0];
			// Use the actual chain we ended up on (might be different from requested if no accounts)
			const connectedChainId = await this.getChainId();

			// 清除 URI
			this.uri = undefined;

			// 触发连接事件
			this.emit('connect', { address, chainId: connectedChainId });

			return {
				address,
				chainId: connectedChainId
			};
		} catch (error) {
			// 清除 URI
			this.uri = undefined;
			this.emit('error', error as Error);
			throw error;
		}
	}

	/**
	 * 断开连接
	 */
	async disconnect(): Promise<void> {
		if (this.provider) {
			await this.provider.disconnect();
			this.provider = null;
		}

		this.uri = undefined;
		this.emit('disconnect');
	}

	/**
	 * 获取当前账户
	 */
	async getAccount(): Promise<Address> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
		}

		const accounts = this.provider.accounts as Address[];

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
			throw new Error('Provider not initialized');
		}

		return this.provider.chainId;
	}

	/**
	 * 获取 WalletClient 实例
	 */
	async getWalletClient(config?: { chainId?: number }): Promise<WalletClient> {
		if (!this.provider) {
			throw new Error('Provider not initialized');
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

		// Set flag to prevent disconnect
		this.isSwitchingChain = true;

		try {
			console.log('[WalletConnect] Switching to chain:', chainId);
			// 尝试切换到目标链
			await this.provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: hexChainId }]
			});

			// Check if there are accounts on the new chain
			const accounts = (await this.provider.request({
				method: 'eth_accounts'
			})) as Address[];

			if (!accounts || accounts.length === 0) {
				console.warn('[WalletConnect] No accounts on chain', chainId);
				// Don't emit chainChanged since we didn't actually switch
				throw new Error(
					`No wallet accounts available on this network (chain ID: ${chainId}). Please ensure your wallet has an account on this network.`
				);
			}

			// Only emit if switch was successful
			this.emit('chainChanged', chainId);
		} catch (error) {
			// If it's our custom error about no accounts, re-throw it
			if (error instanceof Error && error.message.includes('No wallet accounts')) {
				throw error;
			}
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
		} finally {
			// Reset flag after operation
			setTimeout(() => {
				this.isSwitchingChain = false;
			}, 1000);
		}
	}

	/**
	 * 检查是否已授权
	 */
	async isAuthorized(): Promise<boolean> {
		try {
			if (!this.provider) {
				await this.initializeProvider();
			}

			if (!this.provider) {
				return false;
			}

			const accounts = this.provider.accounts as Address[];
			return accounts && accounts.length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * 设置事件监听
	 */
	private isSwitchingChain = false;

	private setupEventListeners(): void {
		if (!this.provider) return;

		// 账户变更
		this.provider.on('accountsChanged', (accounts: string[]) => {
			const addresses = accounts as Address[];
			console.log('[WalletConnect] accountsChanged event:', addresses);
			// Don't disconnect if switching chains - wallet is still connected
			if (addresses.length === 0 && !this.isSwitchingChain) {
				console.log('[WalletConnect] No accounts and not switching - disconnecting');
				this.emit('disconnect');
			} else if (addresses.length === 0 && this.isSwitchingChain) {
				console.log('[WalletConnect] No accounts but switching - NOT disconnecting');
			} else {
				this.emit('accountsChanged', addresses);
			}
		});

		// 链变更
		this.provider.on('chainChanged', (chainId: string) => {
			const id = this.normalizeChainId(chainId);
			this.emit('chainChanged', id);
		});

		// 断开连接
		this.provider.on('disconnect', () => {
			this.emit('disconnect');
		});

		// 会话删除
		this.provider.on('session_delete', () => {
			this.emit('disconnect');
		});
	}
}
