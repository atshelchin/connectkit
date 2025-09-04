<script lang="ts">
	interface Props {
		type?: 'error' | 'warning' | 'success' | 'info';
		message: string;
		onClose?: () => void;
		autoClose?: number; // Auto close after milliseconds
		closable?: boolean;
		class?: string;
	}

	let {
		type = 'error',
		message,
		onClose,
		autoClose,
		closable = true,
		class: className = ''
	}: Props = $props();

	// Auto close timer
	$effect(() => {
		if (autoClose && autoClose > 0) {
			const timer = setTimeout(() => {
				onClose?.();
			}, autoClose);

			return () => clearTimeout(timer);
		}
	});

	// Get icon based on type
	function getIcon(alertType: string) {
		switch (alertType) {
			case 'success':
				return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
					<path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>`;
			case 'warning':
				return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<path d="M8 2L1.5 13H14.5L8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
					<path d="M8 6V9M8 11.5V11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>`;
			case 'info':
				return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
					<path d="M8 8V11M8 5V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>`;
			case 'error':
			default:
				return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
					<circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
					<path d="M10 6L6 10M6 6L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
				</svg>`;
		}
	}
</script>

<div class="alert alert--{type} {className}">
	<div class="alert-content">
		<div class="alert-icon">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html getIcon(type)}
		</div>
		<span class="alert-message">{message}</span>
	</div>
	{#if closable}
		<button class="alert-close" onclick={onClose} aria-label="关闭提示">
			<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path
					d="M1 1L11 11M1 11L11 1"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>
		</button>
	{/if}
</div>

<style>
	.alert {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-2);
		padding: var(--space-3);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		animation: slideIn 200ms ease;
		border: 1px solid;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.alert--error {
		background: var(--color-destructive-bg, #fee2e2);
		color: var(--color-destructive, #dc2626);
		border-color: var(--color-destructive-border, #fca5a5);
	}

	.alert--warning {
		background: var(--color-warning-bg, #fef3c7);
		color: var(--color-warning, #d97706);
		border-color: var(--color-warning-border, #fcd34d);
	}

	.alert--success {
		background: var(--color-success-bg, #dcfce7);
		color: var(--color-success, #10b981);
		border-color: var(--color-success-border, #86efac);
	}

	.alert--info {
		background: var(--color-info-bg, #dbeafe);
		color: var(--color-info, #2563eb);
		border-color: var(--color-info-border, #93c5fd);
	}

	/* Dark mode overrides for better visibility */
	:global([data-theme='dark']) .alert--error {
		background: rgba(239, 68, 68, 0.1);
		color: #f87171;
		border-color: rgba(239, 68, 68, 0.3);
	}

	:global([data-theme='dark']) .alert--warning {
		background: rgba(245, 158, 11, 0.1);
		color: #fbbf24;
		border-color: rgba(245, 158, 11, 0.3);
	}

	:global([data-theme='dark']) .alert--success {
		background: rgba(34, 197, 94, 0.1);
		color: #4ade80;
		border-color: rgba(34, 197, 94, 0.3);
	}

	:global([data-theme='dark']) .alert--info {
		background: rgba(59, 130, 246, 0.1);
		color: #93bbfb;
		border-color: rgba(59, 130, 246, 0.3);
	}

	.alert-content {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		flex: 1;
	}

	.alert-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.alert-message {
		flex: 1;
		line-height: 1.5;
	}

	.alert-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		background: transparent;
		border: none;
		color: currentColor;
		opacity: 0.6;
		cursor: pointer;
		border-radius: var(--radius);
		transition: all 150ms ease;
		flex-shrink: 0;
	}

	.alert-close:hover {
		opacity: 1;
		background: rgba(0, 0, 0, 0.1);
	}

	.alert-close:active {
		transform: scale(0.9);
	}
</style>
