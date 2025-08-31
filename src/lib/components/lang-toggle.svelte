<script lang="ts">
	import { getI18n } from '$lib/i18n/i18n.js';
	const i18n = getI18n();

	const toggleLang = (code: string) => {
		i18n.setLocale(code);
	};
</script>

<button class="lang" onclick={() => toggleLang('en')}>english</button>
<button class="lang" onclick={() => toggleLang('zh')}>中文</button>
<button class="lang" onclick={() => toggleLang('fr')}>法语</button>

{i18n.locale}

<style>
	.lang {
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
