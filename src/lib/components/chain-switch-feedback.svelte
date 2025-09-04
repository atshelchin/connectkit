<script lang="ts">
	interface Props {
		show: boolean;
		type: 'loading' | 'error' | 'success';
		message?: string;
	}

	let { show = false, type = 'loading', message }: Props = $props();
	console.log({ message });
</script>

{#if show}
	<div class="chain-switch-feedback chain-switch-feedback--{type}">
		{#if type === 'loading'}
			<div class="spinner"></div>
			<span>切换中...</span>
		{:else if type === 'error'}
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5" />
				<path
					d="M9 5L5 9M5 5L9 9"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
				/>
			</svg>
			<span>切换失败</span>
		{:else if type === 'success'}
			<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
				<circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5" />
				<path
					d="M4 7L6 9L10 5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span>切换成功</span>
		{/if}
	</div>
{/if}

<style>
	.chain-switch-feedback {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 8px;
		padding: 8px 12px;
		border-radius: var(--radius);
		font-size: var(--text-xs);
		display: flex;
		align-items: center;
		gap: 6px;
		animation: slideDown 200ms ease;
		z-index: 10;
		white-space: nowrap;
		box-shadow: var(--shadow-sm);
		min-width: max-content;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.chain-switch-feedback--loading {
		background: var(--color-info-bg);
		color: var(--color-info);
		border: 1px solid var(--color-info-border);
	}

	.chain-switch-feedback--error {
		background: var(--color-destructive-bg);
		color: var(--color-destructive);
		border: 1px solid var(--color-destructive-border);
	}

	.chain-switch-feedback--success {
		background: var(--color-success-bg);
		color: var(--color-success);
		border: 1px solid var(--color-success-border);
	}

	/* Dark mode overrides */
	:global([data-theme='dark']) .chain-switch-feedback--loading {
		background: rgba(59, 130, 246, 0.1);
		color: #93bbfb;
		border-color: rgba(59, 130, 246, 0.3);
	}

	:global([data-theme='dark']) .chain-switch-feedback--error {
		background: rgba(239, 68, 68, 0.1);
		color: #f87171;
		border-color: rgba(239, 68, 68, 0.3);
	}

	:global([data-theme='dark']) .chain-switch-feedback--success {
		background: rgba(34, 197, 94, 0.1);
		color: #4ade80;
		border-color: rgba(34, 197, 94, 0.3);
	}

	.spinner {
		width: 12px;
		height: 12px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 600ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	svg {
		flex-shrink: 0;
	}
</style>
