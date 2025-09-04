<script lang="ts">
	import { onMount } from 'svelte';
	import EthereumIdentity from './ethereum-identity.svelte';

	interface Props {
		address: string;
		balance?: string;
		onClick?: () => void;
		className?: string;
		showBalance?: boolean;
		mainnet?: boolean;
	}

	let {
		address,
		balance,
		onClick,
		className = '',
		showBalance = true,
		mainnet = false
	}: Props = $props();

	// Button ref to get parent container width
	let buttonRef: HTMLButtonElement;
	let containerWidth = $state(0);

	// Display modes based on width
	let displayMode = $derived.by(() => {
		if (containerWidth < 80) return 'avatar-only';
		if (containerWidth < 160) return 'avatar-address-compact';
		if (containerWidth < 240) return 'avatar-address';
		return 'full';
	});

	// Track parent container width
	onMount(() => {
		if (!buttonRef) return;

		const parentElement = buttonRef.parentElement;
		if (!parentElement) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				containerWidth = entry.contentRect.width;
			}
		});

		observer.observe(parentElement);

		// Initial measurement
		containerWidth = parentElement.offsetWidth;

		return () => {
			observer.disconnect();
		};
	});
</script>

<button
	bind:this={buttonRef}
	class="connected-button {className} {displayMode === 'avatar-only' ? 'avatar-only' : ''}"
	onclick={onClick}
	title={address}
>
	<div class="button-content">
		<!-- Show balance in full mode -->
		{#if displayMode === 'full' && showBalance && balance}
			<span class="balance">{balance} ETH</span>
			<div class="divider"></div>
		{/if}

		<!-- Use EthereumIdentity for avatar and address display -->
		<EthereumIdentity
			{address}
			{mainnet}
			showAvatar={true}
			showAddress={displayMode !== 'avatar-only'}
			avatarSize="xs"
			showCopy={false}
		/>

		<!-- Dropdown indicator for full mode -->
		{#if displayMode === 'full' || displayMode === 'avatar-address'}
			<svg class="dropdown-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
				<path
					d="M3 4.5L6 7.5L9 4.5"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		{/if}
	</div>
</button>

<style>
	.connected-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		cursor: pointer;
		transition: all 150ms ease;
		min-width: fit-content;
		width: auto;
		max-width: 100%;
		height: 40px;
		overflow: hidden;
	}

	.connected-button:hover {
		background: var(--color-muted);
		border-color: var(--color-border-hover);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.connected-button:active {
		transform: translateY(0);
	}

	/* Avatar only state - perfect circle */
	.connected-button.avatar-only {
		border-radius: 50%;
		width: 40px !important;
		height: 40px !important;
		min-width: 40px !important;
		max-width: 40px !important;
		padding: 0 !important;
		justify-content: center;
		align-items: center;
		display: flex;
	}

	.connected-button.avatar-only .button-content {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0;
		width: 32px;
		height: 32px;
	}

	/* Hide the address part of EthereumIdentity in avatar-only mode */
	.connected-button.avatar-only :global(.ethereum-identity) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.connected-button.avatar-only :global(.identity-content) {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.connected-button.avatar-only :global(.address-container) {
		display: none !important;
	}

	.connected-button.avatar-only .dropdown-icon,
	.connected-button.avatar-only .balance,
	.connected-button.avatar-only .divider {
		display: none !important;
	}

	.button-content {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
		min-width: 0;
	}

	.avatar-wrapper {
		flex-shrink: 0;
	}

	.info-wrapper {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-width: 0;
		flex: 1;
	}

	.balance {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.divider {
		width: 1px;
		height: 16px;
		background: var(--color-border);
		flex-shrink: 0;
	}

	.dropdown-icon {
		color: var(--color-muted-foreground);
		flex-shrink: 0;
		margin-left: var(--space-1);
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.connected-button:not(.avatar-only) {
			height: 36px;
			padding: var(--space-1) var(--space-2);
		}
	}
</style>
