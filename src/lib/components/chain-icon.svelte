<script lang="ts">
	import { getChainIcon, getChainName } from './chain-icons.js';

	interface Props {
		chainId: number;
		size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

		showWarning?: boolean; // Show warning badge for unsupported chains
		showTooltip?: boolean; // Show chain name on hover
		className?: string;
	}

	let {
		chainId,
		size = 'md',
		showWarning = false,

		showTooltip = true,
		className = ''
	}: Props = $props();

	// Get size in pixels
	const sizeMap = {
		xs: 16,
		sm: 20,
		md: 24,
		lg: 32,
		xl: 40
	};

	let pixelSize = $derived(sizeMap[size]);
	let iconSvg = $derived(getChainIcon(chainId));
	let chainName = $derived(getChainName(chainId));

	// Process SVG to add current color support
	function processSvg(svg: string, size: number): string {
		// Add width and height attributes if not present
		return svg.replace('<svg', `<svg width="${size}" height="${size}" class="chain-icon-svg"`);
	}

	let processedSvg = $derived(processSvg(iconSvg, pixelSize));
</script>

<div
	class="chain-icon {className}"
	class:chain-icon--unsupported={showWarning}
	title={showTooltip ? chainName : undefined}
	style="--icon-size: {pixelSize}px"
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html processedSvg}

	{#if showWarning}
		<div class="warning-badge" title="Unsupported Network">
			<svg
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="6" cy="6" r="5.5" fill="#DC2626" stroke="white" />
				<path d="M6 3V7" stroke="white" stroke-width="1.5" stroke-linecap="round" />
				<circle cx="6" cy="9" r="0.75" fill="white" />
			</svg>
		</div>
	{/if}
</div>

<style>
	.chain-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
		width: var(--icon-size);
		height: var(--icon-size);
	}

	.chain-icon :global(.chain-icon-svg) {
		display: block;
		border-radius: var(--radius);
	}

	.warning-badge {
		position: absolute;
		top: -2px;
		right: -2px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border-radius: 50%;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
	}

	/* Hover effect */
	.chain-icon:hover :global(.chain-icon-svg) {
		transform: scale(1.05);
		transition: transform 150ms ease;
	}

	/* Unsupported chain styling */
	.chain-icon--unsupported :global(.chain-icon-svg) {
		opacity: 0.7;
	}
</style>
