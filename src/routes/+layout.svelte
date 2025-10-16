<script lang="ts">
	import { createThemeStore } from '$lib/core/stores/theme.svelte.js';
	import '../design-tokens.css';
	import type { LayoutData } from './$types.js';

	import type { PackageLocales } from '@shelchin/i18n';
	import { createI18nStore } from '@shelchin/i18n/svelte';
	import { setI18nContext } from '@shelchin/i18n/svelte';

	import en from '../i18n/locales/en.json' with { type: 'json' };
	import zh from '../i18n/locales/zh.json' with { type: 'json' };
	import shelchin_connectkit_fr from '../i18n/locales/@shelchin/connectkit/fr.json' with { type: 'json' };
	// import shelchin_connectkit_en from '../i18n/locales/@shelchin/connectkit/en.json' with { type: 'json' };
	// import shelchin_connectkit_zh from '../i18n/locales/@shelchin/connectkit/zh.json' with { type: 'json' };

	let { children, data } = $props<{ children: import('svelte').Snippet; data: LayoutData }>();

	// Setup i18n
	const i18n = createI18nStore({ initialLocale: data.locale, defaultPackage: '__default__' });
	i18n.register('__default__', { en, zh } as PackageLocales, 'app');
	// en:shelchin_connectkit_en
	i18n.register(
		'@shelchin/connectkit',
		{
			zh: {
				_meta: {
					code: 'zh',
					name: '中文',
					englishName: 'Chinese',
					direction: 'ltr',
					flag: '🇨🇳'
				},
				abc: 'a123'
			},
			fr: shelchin_connectkit_fr
		} as PackageLocales,
		'app'
	);
	setI18nContext(i18n);

	// Setup theme with initial value from server
	createThemeStore(data.theme);
</script>

<div class="app">
	{@render children()}
</div>

<style>
	:global(:root) {
		--brand-hue: 320; /* 主色调 Primary Hue (0-360) */
		--brand-saturation: 91%; /* 饱和度 Saturation (0-100%) */
		--radius-scale: 1; /* 圆角缩放 Radius Scale */
		--spacing-scale: 1; /* 间距缩放 Spacing Scale */

		/* 无障碍配置 Accessibility Configuration */
		--font-scale: 1; /* 字体缩放 Font Scale */
		--contrast-mode: normal; /* 对比度模式 Contrast Mode */
		--letter-spacing: normal; /* 字间距 Letter Spacing */
		--line-height: 1.6; /* 行高 Line Height */
	}
</style>
