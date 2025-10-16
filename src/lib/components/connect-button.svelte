<script>
	import { useI18n } from '$lib/i18n/i18n.js';
	const i18n = useI18n();
</script>

<button class="connect">{i18n.t('connect')}</button>

<style>
	.connect {
		background-color: var(--color-button-primary);
		color: var(--color-button-primary-foreground);
		padding: var(--space-2-5) var(--space-5);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
	}
</style>
