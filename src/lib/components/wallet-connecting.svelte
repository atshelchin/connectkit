<script lang="ts">
	interface Props {
		walletName: string;
		walletIcon?: string;
		onCancel?: () => void;
		message?: string;
		subMessage?: string;
		mode?: 'default' | 'walletconnect';
		walletConnectUri?: string;
	}

	let {
		walletName,
		walletIcon,
		onCancel,
		message,
		subMessage = '在扩展中确认连接',
		mode = 'default',
		walletConnectUri = 'wc:1234567890abcdef...'
	}: Props = $props();

	// Compute the main message
	let displayMessage = $derived(
		mode === 'walletconnect' ? '使用您的手机扫描' : message || `正在打开 ${walletName}...`
	);

	// State for copy feedback
	let copied = $state(false);

	// Copy WalletConnect URI
	function copyUri() {
		if (walletConnectUri) {
			navigator.clipboard.writeText(walletConnectUri);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		}
	}
</script>

<div class="wallet-connecting">
	<div class="connecting-content">
		{#if mode === 'walletconnect'}
			<!-- WalletConnect QR Code Mode -->
			<h3 class="connecting-title">{displayMessage}</h3>

			<div class="qr-container">
				<!-- QR Code placeholder -->
				<div class="qr-code">
					<svg viewBox="0 0 200 200" class="qr-placeholder">
						<!-- Simplified QR code pattern for placeholder -->
						<rect width="200" height="200" fill="white" />
						<g fill="black">
							<!-- Corner patterns -->
							<rect x="20" y="20" width="60" height="60" rx="4" />
							<rect x="30" y="30" width="40" height="40" fill="white" />
							<rect x="40" y="40" width="20" height="20" />

							<rect x="120" y="20" width="60" height="60" rx="4" />
							<rect x="130" y="30" width="40" height="40" fill="white" />
							<rect x="140" y="40" width="20" height="20" />

							<rect x="20" y="120" width="60" height="60" rx="4" />
							<rect x="30" y="130" width="40" height="40" fill="white" />
							<rect x="40" y="140" width="20" height="20" />

							<!-- Random pattern for demo -->
							<rect x="90" y="30" width="10" height="10" />
							<rect x="90" y="50" width="10" height="10" />
							<rect x="100" y="40" width="10" height="10" />
							<rect x="90" y="90" width="10" height="10" />
							<rect x="110" y="90" width="10" height="10" />
							<rect x="100" y="100" width="10" height="10" />
							<rect x="90" y="110" width="10" height="10" />
							<rect x="130" y="90" width="10" height="10" />
							<rect x="140" y="100" width="10" height="10" />
							<rect x="150" y="90" width="10" height="10" />
						</g>
					</svg>

					<!-- WalletConnect logo overlay -->
					<div class="qr-logo">
						<svg width="40" height="40" viewBox="0 0 40 40" fill="none">
							<rect width="40" height="40" rx="8" fill="white" />
							<rect x="4" y="4" width="32" height="32" rx="6" fill="#3B99FC" />
							<path
								d="M12.2 14.8C15.3 11.7 20.3 11.7 23.5 14.8L23.9 15.2C24.1 15.4 24.1 15.7 23.9 15.9L22.6 17.2C22.5 17.3 22.3 17.3 22.2 17.2L21.7 16.7C19.5 14.5 16.1 14.5 14 16.7L13.4 17.3C13.3 17.4 13.1 17.4 13 17.3L11.7 16C11.5 15.8 11.5 15.5 11.7 15.3L12.2 14.8ZM25.9 17.2L27 18.3C27.2 18.5 27.2 18.8 27 19L22.1 23.9C21.9 24.1 21.6 24.1 21.4 23.9L18 20.5C18 20.4 17.9 20.4 17.8 20.5L14.4 23.9C14.2 24.1 13.9 24.1 13.7 23.9L8.8 19C8.6 18.8 8.6 18.5 8.8 18.3L9.9 17.2C10.1 17 10.4 17 10.6 17.2L14 20.6C14.1 20.7 14.2 20.7 14.3 20.6L17.7 17.2C17.9 17 18.2 17 18.4 17.2L21.8 20.6C21.9 20.7 22 20.7 22.1 20.6L25.5 17.2C25.7 17 26 17 25.9 17.2Z"
								fill="white"
							/>
						</svg>
					</div>
				</div>
			</div>

			<button class="copy-button" onclick={copyUri}>
				{#if copied}
					✓ 已复制
				{:else}
					复制连接链接
				{/if}
			</button>
		{:else}
			<!-- Default Mode -->
			{#if walletIcon}
				{#if walletIcon.startsWith('<svg')}
					<div class="connecting-icon">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html walletIcon}
					</div>
				{:else}
					<img src={walletIcon} alt={walletName} class="connecting-icon" />
				{/if}
			{/if}

			<h3 class="connecting-title">{displayMessage}</h3>
			<p class="connecting-subtitle">{subMessage}</p>

			<div class="connecting-spinner">
				<div class="spinner-ring"></div>
			</div>
		{/if}

		{#if onCancel}
			<button class="cancel-button" onclick={onCancel}> 取消 </button>
		{/if}
	</div>
</div>

<style>
	.wallet-connecting {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		padding: var(--space-8);
	}

	.connecting-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		text-align: center;
		max-width: 280px;
		width: 100%;
	}

	.connecting-icon {
		width: 80px;
		height: 80px;
		border-radius: var(--radius-lg);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-background);
		border: 1px solid var(--color-border);
		padding: var(--space-3);
		margin-bottom: var(--space-2);
		object-fit: contain;
	}

	.connecting-icon :global(svg) {
		width: 100%;
		height: 100%;
	}

	.connecting-title {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-foreground);
	}

	.connecting-subtitle {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.connecting-spinner {
		margin: var(--space-4) 0;
		width: 48px;
		height: 48px;
		position: relative;
	}

	.spinner-ring {
		width: 100%;
		height: 100%;
		border: 3px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.cancel-button {
		padding: var(--space-2) var(--space-4);
		background: transparent;
		color: var(--color-muted-foreground);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		cursor: pointer;
		transition: all 150ms ease;
		margin-top: var(--space-2);
	}

	.cancel-button:hover {
		background: var(--color-muted);
		color: var(--color-foreground);
		border-color: var(--color-border-hover);
	}

	/* WalletConnect QR Code styles */
	.qr-container {
		position: relative;
		width: 280px;
		height: 280px;
		background: white;
		border-radius: var(--radius-lg);
		padding: var(--space-4);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		margin: var(--space-4) 0;
	}

	.qr-code {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.qr-placeholder {
		width: 100%;
		height: 100%;
	}

	.qr-logo {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 40px;
		height: 40px;
		background: white;
		border-radius: var(--radius);
		padding: 2px;
	}

	.copy-button {
		padding: var(--space-3) var(--space-6);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 150ms ease;
		min-width: 140px;
	}

	.copy-button:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.copy-button:active {
		transform: translateY(0);
	}

	/* Mobile responsive */
	@media (max-width: 640px) {
		.wallet-connecting {
			min-height: 320px;
			padding: var(--space-6);
		}

		.connecting-icon {
			width: 64px;
			height: 64px;
		}

		.connecting-title {
			font-size: var(--text-base);
		}
	}
</style>
