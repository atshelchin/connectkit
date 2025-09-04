<script lang="ts">
	import ChainIcon from './chain-icon.svelte';

	interface Props {
		chainId?: number;
		onChainSwitch?: (chainId: number) => void;
		supportedNetworks?: Array<{ chainId: number; name: string; symbol: string }>;
	}

	let {
		chainId = 1,
		onChainSwitch,
		supportedNetworks = [
			{ chainId: 1, name: 'Ethereum', symbol: 'ETH' },
			{ chainId: 137, name: 'Polygon', symbol: 'MATIC' },
			{ chainId: 10, name: 'Optimism', symbol: 'ETH' },
			{ chainId: 42161, name: 'Arbitrum', symbol: 'ETH' },
			{ chainId: 56, name: 'BNB Chain', symbol: 'BNB' },
			{ chainId: 43114, name: 'Avalanche', symbol: 'AVAX' },
			{ chainId: 8453, name: 'Base', symbol: 'ETH' }
		]
	}: Props = $props();

	// Network dropdown state
	let showNetworkDropdown = $state(false);
	let dropdownPosition = $state<'above' | 'below'>('below');
	let dropdownStyle = $state('');
	let networkButtonRef: HTMLButtonElement;

	// Calculate dropdown position based on available space
	function calculateDropdownPosition() {
		if (!networkButtonRef) return;

		const rect = networkButtonRef.getBoundingClientRect();
		const dropdownHeight = Math.min(supportedNetworks.length * 40 + 16, 320); // Max 320px height
		const dropdownWidth = 200; // Min width of dropdown

		const viewportHeight = window.visualViewport?.height || window.innerHeight;
		const viewportWidth = window.visualViewport?.width || window.innerWidth;

		// Calculate available space in each direction
		const spaceBelow = viewportHeight - rect.bottom;
		const spaceAbove = rect.top;
		const spaceRight = viewportWidth - rect.left;
		const spaceLeft = rect.right;

		// Determine vertical position
		let useAbove = false;
		let verticalPos = '';

		// Check if there's enough space below
		if (spaceBelow >= dropdownHeight) {
			// Enough space below
			verticalPos = `top: ${rect.bottom + 8}px;`;
		} else if (spaceAbove >= dropdownHeight) {
			// Not enough below, but enough above
			useAbove = true;
			verticalPos = `bottom: ${viewportHeight - rect.top + 8}px;`;
		} else {
			// Not enough space in either direction, use the direction with more space
			if (spaceAbove > spaceBelow) {
				useAbove = true;
				// Position at top of viewport with some padding
				verticalPos = `top: 8px; max-height: ${rect.top - 16}px;`;
			} else {
				// Position to use all available space below
				verticalPos = `top: ${rect.bottom + 8}px; max-height: ${spaceBelow - 16}px;`;
			}
		}

		// Determine horizontal position
		let horizontalPos = '';
		if (spaceRight >= dropdownWidth) {
			// Align with left edge of button
			horizontalPos = `left: ${rect.left}px; min-width: ${Math.min(dropdownWidth, spaceRight - 8)}px;`;
		} else if (spaceLeft >= dropdownWidth) {
			// Align with right edge of button
			horizontalPos = `right: ${viewportWidth - rect.right}px; min-width: ${Math.min(dropdownWidth, spaceLeft - 8)}px;`;
		} else {
			// Center in viewport with padding
			horizontalPos = `left: 8px; right: 8px;`;
		}

		dropdownPosition = useAbove ? 'above' : 'below';
		dropdownStyle = `${verticalPos} ${horizontalPos}`;
	}

	// Handle network selection
	function selectNetwork(networkChainId: number) {
		console.log('[NetworkSelector] User selected network with chainId:', networkChainId);
		console.log('[NetworkSelector] Current chainId:', chainId);

		if (networkChainId !== chainId) {
			console.log('[NetworkSelector] Triggering chain switch...');
			onChainSwitch?.(networkChainId);
		} else {
			console.log('[NetworkSelector] Already on selected chain, no switch needed');
		}
		showNetworkDropdown = false;
	}

	// Toggle dropdown and calculate position
	function toggleNetworkDropdown() {
		showNetworkDropdown = !showNetworkDropdown;
		if (showNetworkDropdown) {
			// Small delay to ensure DOM is ready
			requestAnimationFrame(() => {
				calculateDropdownPosition();
			});
		}
	}

	// Click outside to close dropdown
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.network-selector') && !target.closest('.network-dropdown')) {
			showNetworkDropdown = false;
		}
	}

	// Handle viewport resize (important for mobile)
	function handleViewportChange() {
		if (showNetworkDropdown) {
			calculateDropdownPosition();
		}
	}

	$effect(() => {
		if (showNetworkDropdown) {
			document.addEventListener('click', handleClickOutside);
			window.visualViewport?.addEventListener('resize', handleViewportChange);
			window.visualViewport?.addEventListener('scroll', handleViewportChange);

			return () => {
				document.removeEventListener('click', handleClickOutside);
				window.visualViewport?.removeEventListener('resize', handleViewportChange);
				window.visualViewport?.removeEventListener('scroll', handleViewportChange);
			};
		}
	});
</script>

<div class="network-selector">
	<button
		bind:this={networkButtonRef}
		class="chain-badge"
		onclick={toggleNetworkDropdown}
		title="切换网络"
		class:active={showNetworkDropdown}
	>
		<ChainIcon {chainId} size="sm" />
		<svg class="dropdown-arrow" width="8" height="8" viewBox="0 0 8 8" fill="none">
			<path
				d="M2 3L4 5L6 3"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	{#if showNetworkDropdown}
		<div
			class="network-dropdown"
			class:dropdown-above={dropdownPosition === 'above'}
			style={dropdownStyle}
		>
			<div class="dropdown-content">
				{#each supportedNetworks as network (network.chainId)}
					<button
						class="network-option"
						class:selected={network.chainId === chainId}
						onclick={() => selectNetwork(network.chainId)}
					>
						<ChainIcon chainId={network.chainId} size="sm" />
						<span class="network-name">{network.name}</span>
						{#if network.chainId === chainId}
							<svg class="check-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
								<path
									d="M11 4L5.5 9.5L3 7"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.network-selector {
		position: relative;
	}

	.chain-badge {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-3);
		background: var(--color-panel-1);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 150ms ease;
		min-width: 60px;
		height: auto;
	}

	.chain-badge:hover {
		background: var(--color-muted);
		border-color: var(--color-border-hover);
	}

	.chain-badge.active {
		background: var(--color-muted);
		border-color: var(--color-primary);
		z-index: 1001;
	}

	.dropdown-arrow {
		color: var(--color-muted-foreground);
		transition: transform 150ms ease;
	}

	.chain-badge.active .dropdown-arrow {
		transform: rotate(180deg);
	}

	/* Network dropdown - as a separate fixed layer */
	.network-dropdown {
		position: fixed;
		min-width: 180px;
		max-width: calc(100vw - 16px); /* Prevent overflow on mobile */
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		animation: slideDown 200ms ease;
		z-index: 9999; /* Higher z-index for mobile modals */
		overflow: hidden;
		-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
		transform: translateZ(0); /* Force GPU acceleration */
		will-change: transform, opacity; /* Optimize animations */
	}

	.network-dropdown.dropdown-above {
		animation: slideUp 200ms ease;
	}

	/* iOS Safari specific fixes */
	@supports (-webkit-touch-callout: none) {
		.network-dropdown {
			/* Prevent iOS bounce scrolling issues */
			position: fixed;
			transform: translate3d(0, 0, 0);
		}
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dropdown-content {
		padding: var(--space-2);
		max-height: inherit; /* Inherit from parent which is dynamically set */
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
	}

	.network-option {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: transparent;
		border: none;
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 150ms ease;
		text-align: left;
		position: relative;
	}

	.network-option:hover {
		background: var(--color-muted);
	}

	.network-option.selected {
		background: var(--color-primary-bg, rgba(59, 130, 246, 0.1));
		color: var(--color-primary);
	}

	.network-name {
		flex: 1;
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
	}

	.network-option.selected .network-name {
		color: var(--color-primary);
	}

	.check-icon {
		color: var(--color-primary);
		flex-shrink: 0;
	}
</style>
