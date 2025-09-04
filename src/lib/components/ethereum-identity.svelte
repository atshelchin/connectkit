<script lang="ts">
	import { onMount } from 'svelte';
	import { createPublicClient, http, type Address } from 'viem';
	import { mainnet } from 'viem/chains';
	import { normalize } from 'viem/ens';
	import { getEnsAvatar, getEnsName } from 'viem/ens';
	import Avatar from './avatar.svelte';
	import AddressDisplay from './address-display.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		address: string;
		// RPC URL for ENS queries
		rpcUrl?: string;
		// What to show
		showAvatar?: boolean;
		showAddress?: boolean;
		// Avatar size
		avatarSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
		// Whether avatar is rounded
		avatarRounded?: boolean;
		// Whether to show ENS badge
		showBadge?: boolean;
		// AddressDisplay mode
		addressMode?: 'auto' | 'full' | 'truncate';
		// AddressDisplay truncate chars
		truncateChars?: number;
		// Whether to show copy icon
		showCopyIcon?: boolean;
		// Text size
		textSize?: 'xs' | 'sm' | 'base' | 'lg';
		// Custom loading content
		loading?: Snippet;
		// Custom error content
		error?: Snippet<[{ error: Error }]>;
		// Children content (custom layout)
		children?: Snippet<
			[
				{
					address: string;
					ensName: string | null;
					ensAvatar: string | null;
					isLoading: boolean;
					error: Error | null;
				}
			]
		>;
		// Copy address on click
		copyOnClick?: boolean;
		// Cache duration in milliseconds
		cacheDuration?: number;
	}

	let {
		address,
		rpcUrl = 'https://0xrpc.io/eth',
		showAvatar = true,
		showAddress = true,
		avatarSize = 'md',
		avatarRounded = true,
		showBadge = true,
		addressMode = 'auto',
		truncateChars = 4, // Show 4 chars on each side for better spacing
		showCopyIcon = true, // Default to true so users know they can copy
		textSize = 'base',
		loading,
		error,
		children,
		copyOnClick = true,
		cacheDuration = 3600000 // 1 hour
	}: Props = $props();

	// State
	let ensName = $state<string | null>(null);
	let ensAvatar = $state<string | null>(null);
	let isLoading = $state(false);
	let queryError = $state<Error | null>(null);

	// Create viem client
	const client = createPublicClient({
		chain: mainnet,
		transport: http(rpcUrl)
	});

	// Cache management - using object instead of Map for reactivity
	const cache: Record<
		string,
		{
			name: string | null;
			avatar: string | null;
			timestamp: number;
		}
	> = {};

	// Validate Ethereum address
	function isValidEthereumAddress(addr: string): boolean {
		if (!addr || typeof addr !== 'string') return false;
		// Check if it's a valid Ethereum address (0x followed by 40 hex characters)
		return /^0x[a-fA-F0-9]{40}$/.test(addr);
	}

	// Load ENS data
	async function loadEnsData(addr: string) {
		if (!addr) return;

		// Validate address first to avoid RPC errors
		if (!isValidEthereumAddress(addr)) {
			ensName = null;
			ensAvatar = null;
			queryError = new Error('Invalid address');
			isLoading = false;
			return;
		}

		// Check cache first
		const cached = cache[addr.toLowerCase()];
		if (cached && Date.now() - cached.timestamp < cacheDuration) {
			ensName = cached.name;
			ensAvatar = cached.avatar;
			return;
		}

		try {
			isLoading = true;
			queryError = null;

			// Query ENS name
			const name = await getEnsName(client, {
				address: addr as Address
			});

			ensName = name;

			// Query ENS avatar if name exists
			if (name) {
				try {
					const avatar = await getEnsAvatar(client, {
						name: normalize(name)
					});
					ensAvatar = avatar;
				} catch (avatarError) {
					// Avatar query might fail even if name exists
					console.warn('Failed to fetch ENS avatar:', avatarError);
					ensAvatar = null;
				}
			} else {
				ensAvatar = null;
			}

			// Update cache
			cache[addr.toLowerCase()] = {
				name: ensName,
				avatar: ensAvatar,
				timestamp: Date.now()
			};
		} catch (err) {
			queryError = err as Error;
			// Simplify error message
			const errorMessage = err instanceof Error ? err.message : 'Failed to load ENS';
			console.error('ENS error:', errorMessage.split('\n')[0]); // Log only first line
		} finally {
			isLoading = false;
		}
	}

	// Load data when address changes
	$effect(() => {
		if (address) {
			loadEnsData(address);
		} else {
			ensName = null;
			ensAvatar = null;
			queryError = null;
		}
	});

	// Clear cache periodically
	onMount(() => {
		const interval = setInterval(() => {
			const now = Date.now();
			for (const key in cache) {
				if (cache[key] && now - cache[key].timestamp > cacheDuration) {
					delete cache[key];
				}
			}
		}, cacheDuration);

		return () => clearInterval(interval);
	});
</script>

<div class="ethereum-identity">
	{#if children}
		<!-- Custom layout via children snippet -->
		{@render children({
			address,
			ensName,
			ensAvatar,
			isLoading,
			error: queryError
		})}
	{:else}
		<!-- Default layout -->
		<div class="identity-container">
			{#if showAvatar}
				<Avatar
					{address}
					ensImage={ensAvatar}
					{ensName}
					size={avatarSize}
					rounded={avatarRounded}
					{showBadge}
				/>
			{/if}

			{#if showAddress}
				{#if isLoading && loading}
					{@render loading()}
				{:else if queryError && error}
					{@render error({ error: queryError })}
				{:else}
					<AddressDisplay
						{address}
						{ensName}
						mode={addressMode}
						{truncateChars}
						{copyOnClick}
						{showCopyIcon}
						size={textSize}
					/>
				{/if}
			{/if}
		</div>
	{/if}
</div>

<style>
	.ethereum-identity {
		display: inline-block;
		width: 100%;
	}

	.identity-container {
		display: inline-flex;
		align-items: center;
		gap: var(--space-3);
		/* Add padding to ensure badge is not cut off */
		padding: 4px;
		margin: -4px; /* Compensate for padding to maintain alignment */
	}

	/* Loading skeleton */
	:global(.ethereum-identity .skeleton) {
		background: var(--color-muted);
		border-radius: var(--radius);
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}

	@keyframes skeleton-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
