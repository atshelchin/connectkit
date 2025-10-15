export interface RpcValidationResult {
	isValid: boolean;
	latency?: number;
	error?: string;
	chainId?: number;
}

/**
 * 验证 RPC URL 是否可用
 * @param url RPC URL
 * @param timeout 超时时间（毫秒），默认 5000ms
 * @param expectedChainId 期望的 Chain ID，如果提供则会验证 RPC 返回的 Chain ID 是否匹配
 */
export async function validateRpcUrl(
	url: string,
	timeout: number = 5000,
	expectedChainId?: number
): Promise<RpcValidationResult> {
	// 基础 URL 格式验证
	try {
		new URL(url);
	} catch {
		return {
			isValid: false,
			error: 'URL 格式错误'
		};
	}

	const startTime = Date.now();

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		// 批量请求：获取区块号和 Chain ID
		const batchRequest = [
			{
				jsonrpc: '2.0',
				method: 'eth_blockNumber',
				params: [],
				id: 1
			},
			{
				jsonrpc: '2.0',
				method: 'eth_chainId',
				params: [],
				id: 2
			}
		];

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(batchRequest),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			return {
				isValid: false,
				error: `HTTP ${response.status}: ${response.statusText}`
			};
		}

		const batchData = (await response.json()) as Array<{
			result?: string;
			error?: { message?: string };
		}>;
		const latency = Date.now() - startTime;

		// 检查响应格式
		if (!Array.isArray(batchData) || batchData.length < 2) {
			return {
				isValid: false,
				error: 'RPC 响应格式无效'
			};
		}

		// 检查 eth_blockNumber 结果
		const blockNumberResult = batchData[0];
		if (!blockNumberResult.result && !blockNumberResult.error) {
			return {
				isValid: false,
				error: 'RPC 响应格式无效'
			};
		}

		if (blockNumberResult.error) {
			return {
				isValid: false,
				error: `RPC 错误: ${blockNumberResult.error.message || 'Unknown error'}`
			};
		}

		// 检查 eth_chainId 结果
		const chainIdResult = batchData[1];
		let actualChainId: number | undefined;

		if (chainIdResult.result) {
			// 将十六进制 Chain ID 转换为十进制
			actualChainId = parseInt(chainIdResult.result, 16);

			// 如果提供了期望的 Chain ID，进行验证
			if (expectedChainId !== undefined && actualChainId !== expectedChainId) {
				return {
					isValid: false,
					error: `Chain ID 不匹配: 期望 ${expectedChainId}, 实际 ${actualChainId}`,
					chainId: actualChainId
				};
			}
		}

		return {
			isValid: true,
			latency,
			chainId: actualChainId
		};
	} catch (error) {
		if (error instanceof Error) {
			if (error.name === 'AbortError') {
				return {
					isValid: false,
					error: '请求超时'
				};
			}

			return {
				isValid: false,
				error: error.message || '连接失败'
			};
		}

		return {
			isValid: false,
			error: '未知错误'
		};
	}
}

/**
 * 批量验证多个 RPC URL
 */
export async function validateRpcUrls(
	urls: string[],
	timeout?: number,
	expectedChainId?: number
): Promise<RpcValidationResult[]> {
	return Promise.all(urls.map((url) => validateRpcUrl(url, timeout, expectedChainId)));
}

/**
 * 获取延迟状态描述
 */
export function getLatencyStatus(latency?: number): {
	label: string;
	color: string;
} {
	if (!latency) {
		return { label: '未知', color: 'var(--color-muted-foreground)' };
	}

	if (latency < 100) {
		return { label: '优秀', color: 'var(--color-success)' };
	} else if (latency < 300) {
		return { label: '良好', color: 'var(--color-info)' };
	} else if (latency < 1000) {
		return { label: '一般', color: 'var(--color-warning)' };
	} else {
		return { label: '较慢', color: 'var(--color-danger)' };
	}
}
