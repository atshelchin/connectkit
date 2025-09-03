<script lang="ts">
	import { LangToggle, ThemeToggle } from '$lib/components/index.js';
	import ModalExamples from '$lib/components/modal.examples.svelte';
	import ThemeToggleExamples from '$lib/components/theme-toggle.examples.svelte';
	import ConnectButtonExamples from '$lib/components/connect-button.examples.svelte';
</script>

<div class="container">
	<header>
		<h1>ConnectKit Components</h1>
		<div class="header-actions">
			<ThemeToggle />
			<LangToggle />
			<a href="/demo" class="link">View Demo →</a>
		</div>
	</header>

	<section class="component-section">
		<h2>Theme Toggle</h2>
		<ThemeToggleExamples />
	</section>

	<section class="component-section">
		<h2>Connect Button</h2>
		<ConnectButtonExamples />
	</section>

	<section class="component-section">
		<h2>Modal Component</h2>
		<ModalExamples />
	</section>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-8);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-12);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--color-border);
	}

	h1 {
		font-size: var(--text-3xl);
		font-weight: var(--font-bold);
		margin: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.link {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: var(--font-medium);
		transition: opacity 150ms ease;
	}

	.link:hover {
		opacity: 0.8;
	}

	.component-section {
		margin-bottom: var(--space-16);
	}

	.component-section h2 {
		font-size: var(--text-2xl);
		font-weight: var(--font-semibold);
		margin-bottom: var(--space-6);
	}

	@media (max-width: 640px) {
		.container {
			padding: var(--space-4);
		}

		header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-4);
		}
	}
</style>
