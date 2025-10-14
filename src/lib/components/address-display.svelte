<script lang="ts">
	interface Props {
		address: string;
		ensName?: string | null;
		// Display mode
		mode?: 'auto' | 'full' | 'truncate';
		// Number of chars to show at start and end when truncated
		truncateChars?: number;
		// Whether to copy on click
		copyOnClick?: boolean;
		// Custom class
		class?: string;
		// Show copy icon
		showCopyIcon?: boolean;
		// Text size
		size?: 'xs' | 'sm' | 'base' | 'lg';
		// Whether to show tooltip with full address
		showTooltip?: boolean;
	}

	let {
		address,
		ensName = null,
		mode = 'auto',
		truncateChars = 4, // Reduce to 4 chars for better spacing (0x1234...5678)
		copyOnClick = true,
		class: className = '',
		showCopyIcon = true, // Default to true to show copy icon when copyOnClick is enabled
		size = 'base',
		showTooltip = true
	}: Props = $props();

	// State
	let copied = $state(false);

	// Display text
	const displayText = $derived.by(() => {
		// Prefer ENS name
		if (ensName) {
			return ensName;
		}

		// Handle address display
		if (!address) return '';

		// Always truncate addresses to prevent overflow
		// Full mode shows more characters, truncate mode shows less
		if (mode === 'full') {
			// Show more characters in full mode but still truncate for safety
			return truncateAddress(address, 8);
		}

		// Truncate mode and auto mode - always truncate to prevent overflow
		return truncateAddress(address, truncateChars);
	});

	// Check if using address (for monospace font)
	const isAddress = $derived(!ensName);

	// Tooltip text
	const tooltipText = $derived.by(() => {
		if (!showTooltip) return '';
		if (ensName) {
			return `${ensName}\n${address}`;
		}
		return address;
	});

	// Truncate address - always keep 0x prefix visible
	function truncateAddress(addr: string, chars: number): string {
		if (!addr || addr.length <= chars * 2 + 3) return addr;
		// Ensure we show 0x + chars at start and chars at end
		// Use the exact chars requested, no minimum override
		return `${addr.slice(0, 2 + chars)}...${addr.slice(-chars)}`;
	}

	// Copy to clipboard
	async function handleCopy(e: MouseEvent) {
		if (!copyOnClick || !address) return;

		e.preventDefault();
		e.stopPropagation();

		try {
			await navigator.clipboard.writeText(address);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy address:', err);
		}
	}
</script>

{#if copyOnClick}
	<button
		type="button"
		class="address-display address-display--{size} {className} clickable"
		class:copied
		onclick={handleCopy}
		title={tooltipText}
		aria-label={`Copy address: ${address}`}
	>
		<span class="address-text" class:monospace={isAddress} class:ens-name={!isAddress}>
			{displayText}
		</span>

		{#if showCopyIcon && !copied}
			<svg class="copy-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
				<path
					d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
				/>
			</svg>
		{/if}

		{#if copied}
			<svg class="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
				<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
			</svg>
		{/if}
	</button>
{:else}
	<div
		class="address-display address-display--{size} {className}"
		title={tooltipText}
		aria-label={address}
	>
		<span class="address-text" class:monospace={isAddress} class:ens-name={!isAddress}>
			{displayText}
		</span>
	</div>
{/if}

<style>
	.address-display {
		display: inline-flex; /* inline-flex to not take full width by default */
		align-items: center;
		gap: var(--space-3); /* Increase gap for better spacing */
		max-width: 100%;
		min-width: 0; /* Important for flex items to shrink */
		position: relative;
		color: var(--color-foreground);
		transition: all 150ms ease;
		overflow: hidden; /* Prevent content from overflowing */
		box-sizing: border-box;
		padding-right: var(--space-1); /* Add padding to prevent icon from touching edge */
		background: none;
		border: none;
		font: inherit;
		text-align: left;
	}

	.address-display.clickable {
		cursor: pointer;
		user-select: none;
	}

	.address-display.clickable:hover {
		color: var(--color-primary);
	}

	.address-display.clickable:active {
		transform: scale(0.98);
	}

	.address-display.copied {
		color: var(--color-success);
	}

	/* Text styles */
	.address-text {
		white-space: nowrap;
		min-width: 0; /* Critical for text truncation in flex containers */
		flex: 0 1 auto; /* Don't grow, can shrink, size based on content */
	}

	.address-text.monospace {
		font-family: var(--font-family-mono);
		letter-spacing: 0.02em;
	}

	.address-text.ens-name {
		font-family: var(--font-family);
		font-weight: var(--font-medium);
	}

	/* Size variations */
	.address-display--xs {
		font-size: var(--text-xs);
	}

	.address-display--sm {
		font-size: var(--text-sm);
	}

	.address-display--base {
		font-size: var(--text-base);
	}

	.address-display--lg {
		font-size: var(--text-lg);
	}

	/* Icons */
	.copy-icon,
	.check-icon {
		flex-shrink: 0; /* Icons should not shrink */
		width: 16px;
		height: 16px;
		opacity: 0.5;
		transition: opacity 150ms ease;
	}

	.address-display:hover .copy-icon {
		opacity: 1;
	}

	.check-icon {
		color: var(--color-success);
		opacity: 1;
		animation: check-bounce 300ms ease;
	}

	@keyframes check-bounce {
		0% {
			transform: scale(0);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}

	/* Focus styles */
	.address-display.clickable:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
		border-radius: var(--radius);
	}

	/* Tooltip styles (browser native) */
	.address-display[title]:hover::after {
		white-space: pre-wrap;
	}

	/* Mobile adjustments */
	@media (max-width: 640px) {
		.address-display--base,
		.address-display--lg {
			font-size: var(--text-sm);
		}
	}

	/* High contrast mode */
	:global([data-contrast='high']) .address-display {
		font-weight: var(--font-medium);
	}

	:global([data-contrast='ultra']) .address-display {
		font-weight: var(--font-semibold);
	}
</style>
