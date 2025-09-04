<script lang="ts">
	interface Props {
		icon?: string;
		name: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		className?: string;
	}

	let { icon, name, size = 'lg', className = '' }: Props = $props();

	const sizeMap = {
		sm: 32,
		md: 48,
		lg: 64,
		xl: 80
	};

	const iconSize = $derived(sizeMap[size]);
</script>

<div class="wallet-icon wallet-icon--{size} {className}">
	<!-- Always show the icon -->
	{#if icon}
		{#if icon.startsWith('<svg')}
			<!-- SVG string -->
			<div class="icon-svg">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html icon}
			</div>
		{:else if icon.startsWith('data:image')}
			<!-- Base64 or data URL -->
			<img src={icon} alt={name} class="icon-image" />
		{:else}
			<!-- URL -->
			<img src={icon} alt={name} class="icon-image" />
		{/if}
	{:else}
		<!-- Fallback with first letter -->
		<div class="icon-fallback" style="width: {iconSize}px; height: {iconSize}px;">
			{name.charAt(0).toUpperCase()}
		</div>
	{/if}
</div>

<style>
	.wallet-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
		overflow: hidden;
		background: var(--color-panel-1);
		position: relative;
	}

	.wallet-icon--sm {
		width: 32px;
		height: 32px;
	}

	.wallet-icon--md {
		width: 48px;
		height: 48px;
	}

	.wallet-icon--lg {
		width: 64px;
		height: 64px;
	}

	.wallet-icon--xl {
		width: 80px;
		height: 80px;
	}

	.icon-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.icon-svg {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-svg :global(svg) {
		width: 100%;
		height: 100%;
	}

	.icon-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-primary);
		color: var(--color-primary-foreground);
		font-size: calc(var(--size) * 0.4);
		font-weight: var(--font-semibold);
		width: 100%;
		height: 100%;
	}

	.wallet-icon--sm .icon-fallback {
		font-size: var(--text-sm);
	}

	.wallet-icon--md .icon-fallback {
		font-size: var(--text-lg);
	}

	.wallet-icon--lg .icon-fallback {
		font-size: var(--text-2xl);
	}

	.wallet-icon--xl .icon-fallback {
		font-size: var(--text-3xl);
	}
</style>
