<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from './qr-code.svelte';
	import WalletIcon from './wallet-icon.svelte';

	interface Props {
		walletName: string;
		walletIcon?: string;
		mode?: 'default' | 'walletconnect';
		walletConnectUri?: string;
		message?: string;
		errorMessage?: string;
		onCancel?: () => void;
		onRetry?: () => void;
		className?: string;
	}

	let {
		walletName,
		walletIcon,
		mode = 'default',
		walletConnectUri,
		message,
		errorMessage,
		onCancel,
		onRetry,
		className = ''
	}: Props = $props();

	let copyFeedback = $state(false);

	// Display message based on mode
	let displayMessage = $derived(
		mode === 'walletconnect' ? 'Scan with Phone' : message || `正在打开 ${walletName}...`
	);

	// Copy to clipboard
	async function handleCopy() {
		if (!walletConnectUri) return;

		try {
			// Use fallback for older browsers
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(walletConnectUri);
			} else {
				// Fallback method for non-secure contexts
				const textArea = document.createElement('textarea');
				textArea.value = walletConnectUri;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				textArea.style.top = '-999999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();

				try {
					document.execCommand('copy');
				} finally {
					textArea.remove();
				}
			}

			copyFeedback = true;
			setTimeout(() => {
				copyFeedback = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}

	// Auto-focus for accessibility
	let containerRef: HTMLDivElement;
	onMount(() => {
		containerRef?.focus();
	});
</script>

<div
	class="wallet-connecting {className}"
	bind:this={containerRef}
	tabindex="-1"
	role="dialog"
	aria-labelledby="wallet-connecting-title"
>
	<div class="connecting-content">
		<!-- Wallet Icon -->
		<div class="wallet-icon-container">
			<WalletIcon name={walletName} icon={walletIcon} size="xl" />
		</div>

		<!-- Title and Message -->
		<div class="connecting-info">
			<h3 id="wallet-connecting-title" class="connecting-title">{displayMessage}</h3>

			{#if mode === 'walletconnect'}
				<p class="connecting-subtitle">Use your phone camera or copy the link to connect</p>
			{:else}
				<p class="connecting-subtitle">请在弹出的窗口中确认连接</p>

				<!-- Beautiful loading spinner below the message -->
				<div class="loading-indicator">
					<div class="pulse-loader">
						<span></span>
						<span></span>
						<span></span>
					</div>
				</div>
			{/if}
		</div>

		<!-- WalletConnect QR Code -->
		{#if mode === 'walletconnect'}
			<div class="qr-container">
				{#if walletConnectUri}
					<div class="qr-wrapper">
						<QRCode data={walletConnectUri} size={248} />
					</div>

					<!-- Copy Link Button -->
					<button
						class="copy-button"
						class:copied={copyFeedback}
						onclick={handleCopy}
						aria-label={copyFeedback ? 'Link copied!' : 'Copy link'}
					>
						{#if copyFeedback}
							<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
								<path
									d="M13.5 4.5L6 12L2.5 8.5"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
									fill="none"
								/>
							</svg>
						{:else}
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<rect x="5.5" y="5.5" width="8" height="8" rx="1" stroke="currentColor" />
								<path
									d="M3.5 10.5V3.5C3.5 2.94772 3.94772 2.5 4.5 2.5H11.5"
									stroke="currentColor"
								/>
							</svg>
						{/if}
						<span>Copy Link</span>
					</button>
				{:else}
					<!-- Loading state -->
					<div class="qr-loading">
						<div class="loading-spinner">
							<div class="spinner-ring"></div>
						</div>
						<p class="loading-text">Initializing...</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Error or Retry Message -->
		{#if errorMessage}
			<div class="error-info">
				<p class="error-text">{errorMessage}</p>
				{#if onRetry}
					<button class="retry-button" onclick={onRetry}>
						<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
							<path
								d="M2 8C2 4.68629 4.68629 2 8 2C10.0833 2 11.9167 3.08333 13 4.66667L14 6M14 8C14 11.3137 11.3137 14 8 14C5.91667 14 4.08333 12.9167 3 11.3333L2 10"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<polyline
								points="2 4 2 6 4 6"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
							<polyline
								points="12 10 14 10 14 12"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
						<span>重试连接</span>
					</button>
				{/if}
			</div>
		{:else if mode === 'default'}
			<div class="retry-info">
				<p class="retry-text">
					没有弹出窗口？
					<button class="retry-link" onclick={() => window.location.reload()}> 点击重试 </button>
				</p>
			</div>
		{/if}

		<!-- Cancel Button -->
		{#if onCancel}
			<button class="cancel-button" onclick={onCancel}> 取消连接 </button>
		{/if}
	</div>
</div>

<style>
	.wallet-connecting {
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
		padding: var(--space-6);
		background: var(--color-background);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-border);
		outline: none;
	}

	.connecting-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.wallet-icon-container {
		margin-bottom: var(--space-2);
	}

	.connecting-info {
		text-align: center;
		margin-bottom: var(--space-4);
	}

	.connecting-title {
		font-size: var(--text-xl);
		font-weight: var(--font-semibold);
		color: var(--color-heading-1);
		margin: 0 0 var(--space-2) 0;
	}

	.connecting-subtitle {
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.qr-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		width: 100%;
	}

	.qr-wrapper {
		padding: var(--space-3);
		background: var(--color-panel-1);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-border);
	}

	.qr-loading {
		width: 280px;
		height: 280px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		background: var(--color-panel-1);
		border-radius: var(--radius-xl);
		border: 1px solid var(--color-border);
	}

	.loading-spinner {
		width: 48px;
		height: 48px;
		position: relative;
	}

	.spinner-ring {
		width: 100%;
		height: 100%;
		border: 3px solid var(--color-muted);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-text {
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.copy-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: transparent;
		color: var(--color-muted-foreground);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.copy-button:hover {
		background: var(--color-muted);
		border-color: var(--color-border-hover);
		color: var(--color-foreground);
	}

	.copy-button.copied {
		color: var(--color-success);
		border-color: var(--color-success);
	}

	.copy-button.copied svg {
		color: var(--color-success);
	}

	.error-info {
		margin-top: var(--space-3);
		padding: var(--space-3);
		background: rgba(239, 68, 68, 0.05);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius);
		text-align: center;
	}

	:global([data-theme='dark']) .error-info {
		background: rgba(239, 68, 68, 0.1);
		border-color: rgba(239, 68, 68, 0.3);
	}

	.error-text {
		font-size: var(--text-sm);
		color: var(--color-danger);
		margin: 0 0 var(--space-2) 0;
		line-height: 1.5;
	}

	.retry-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.retry-button:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	.retry-info {
		margin-top: var(--space-2);
		text-align: center;
	}

	.retry-text {
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
		margin: 0;
	}

	.retry-link {
		color: var(--color-primary);
		background: none;
		border: none;
		padding: 0;
		font-size: inherit;
		cursor: pointer;
		text-decoration: underline;
	}

	.retry-link:hover {
		opacity: 0.8;
	}

	.cancel-button {
		width: 100%;
		padding: var(--space-3);
		background: var(--color-muted);
		color: var(--color-foreground);
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 150ms ease;
		margin-top: var(--space-2);
	}

	.cancel-button:hover {
		background: var(--color-muted-foreground);
		color: var(--color-background);
	}

	/* Beautiful loading indicator */
	.loading-indicator {
		margin-top: var(--space-4);
		display: flex;
		justify-content: center;
	}

	.pulse-loader {
		display: flex;
		gap: var(--space-2);
	}

	.pulse-loader span {
		display: inline-block;
		width: 12px;
		height: 12px;
		background: var(--color-primary);
		border-radius: 50%;
		animation: pulse 1.4s ease-in-out infinite;
	}

	.pulse-loader span:nth-child(1) {
		animation-delay: -0.32s;
	}

	.pulse-loader span:nth-child(2) {
		animation-delay: -0.16s;
	}

	@keyframes pulse {
		0%,
		80%,
		100% {
			transform: scale(0.8);
			opacity: 0.5;
		}
		40% {
			transform: scale(1.2);
			opacity: 1;
		}
	}

	@media (max-width: 640px) {
		.wallet-connecting {
			max-width: 100%;
			border-radius: var(--radius-lg);
		}
	}
</style>
