<script lang="ts">
	import '../design-tokens.css';
	import type { LayoutData } from './$types.js';
	let { children } = $props<{ children: import('svelte').Snippet; data: LayoutData }>();
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
