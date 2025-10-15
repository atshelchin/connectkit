<script lang="ts">
	import EthereumIdentity from '../lib/components/ethereum-identity.svelte';
	import Avatar from '../lib/components/avatar.svelte';

	// Example addresses with known ENS names
	const addresses = [
		{
			address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
			description: 'Vitalik Buterin (vitalik.eth)'
		},
		{
			address: '0x983110309620D911731Ac0932219af06091b6744',
			description: 'ENS: brantly.eth'
		},
		{
			address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
			description: 'ENS Token Contract'
		},
		{
			address: '0x1234567890123456789012345678901234567890',
			description: 'Random Address (No ENS)'
		}
	];

	// Interactive demo state
	let customAddress = $state('');
	let showAvatar = $state(true);
	let showAddress = $state(true);
	let addressMode = $state<'auto' | 'full' | 'truncate'>('auto');
	let truncateChars = $state(6);
	let copyOnClick = $state(true);
	let showCopyIcon = $state(true);
	let avatarSize = $state<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
	let textSize = $state<'xs' | 'sm' | 'base' | 'lg'>('base');
</script>

<div class="ethereum-identity-examples">
	<!-- Basic Examples -->
	<section>
		<h3>Basic Usage</h3>
		<div class="example-grid">
			{#each addresses as item (item.address)}
				<div class="example-item">
					<EthereumIdentity address={item.address} />
					<span class="description">{item.description}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Different Sizes -->
	<section>
		<h3>Avatar Sizes</h3>
		<div class="size-examples">
			<EthereumIdentity address={addresses[0].address} avatarSize="xs" />
			<EthereumIdentity address={addresses[0].address} avatarSize="sm" />
			<EthereumIdentity address={addresses[0].address} avatarSize="md" />
			<EthereumIdentity address={addresses[0].address} avatarSize="lg" />
			<EthereumIdentity address={addresses[0].address} avatarSize="xl" />
		</div>
	</section>

	<!-- Display Variations -->
	<section>
		<h3>Display Options</h3>
		<div class="variations">
			<div class="variation-item">
				<h4>Avatar Only</h4>
				<EthereumIdentity address={addresses[0].address} showAvatar={true} showAddress={false} />
			</div>

			<div class="variation-item">
				<h4>Address Only</h4>
				<EthereumIdentity address={addresses[0].address} showAvatar={false} showAddress={true} />
			</div>

			<div class="variation-item">
				<h4>Both (default)</h4>
				<EthereumIdentity address={addresses[0].address} showAvatar={true} showAddress={true} />
			</div>

			<div class="variation-item">
				<h4>Full Address Mode</h4>
				<EthereumIdentity address={addresses[0].address} addressMode="full" />
			</div>

			<div class="variation-item">
				<h4>No Copy Icon</h4>
				<EthereumIdentity address={addresses[0].address} showCopyIcon={false} />
			</div>

			<div class="variation-item">
				<h4>Square Avatar</h4>
				<EthereumIdentity address={addresses[0].address} avatarRounded={false} />
			</div>
		</div>
	</section>

	<!-- Custom Layout -->
	<section>
		<h3>Custom Layout with Children</h3>
		<div class="custom-layouts">
			<!-- Card Layout -->
			<EthereumIdentity address={addresses[0].address}>
				{#snippet children({ address, ensName, ensAvatar, isLoading })}
					<div class="custom-card">
						<Avatar {address} ensImage={ensAvatar} {ensName} size="lg" />
						<div class="card-content">
							{#if isLoading}
								<div class="skeleton" style="width: 100px; height: 20px;"></div>
							{:else if ensName}
								<h4>{ensName}</h4>
								<p>{address.slice(0, 6)}...{address.slice(-4)}</p>
							{:else}
								<h4>Anonymous</h4>
								<p>{address.slice(0, 6)}...{address.slice(-4)}</p>
							{/if}
						</div>
					</div>
				{/snippet}
			</EthereumIdentity>

			<!-- Inline Layout -->
			<EthereumIdentity address={addresses[1].address}>
				{#snippet children({ address, ensName, ensAvatar })}
					<div class="custom-inline">
						<Avatar {address} ensImage={ensAvatar} {ensName} size="sm" />
						<span>{ensName || `${address.slice(0, 6)}...`}</span>
					</div>
				{/snippet}
			</EthereumIdentity>

			<!-- Badge Layout -->
			<EthereumIdentity address={addresses[0].address}>
				{#snippet children({ address, ensName, ensAvatar })}
					<div class="custom-badge">
						<Avatar {address} ensImage={ensAvatar} {ensName} size="xs" />
						<span class="badge-text">{ensName || 'User'}</span>
					</div>
				{/snippet}
			</EthereumIdentity>
		</div>
	</section>

	<!-- Loading States -->
	<section>
		<h3>Loading & Error States</h3>
		<div class="states">
			<!-- Custom Loading -->
			<EthereumIdentity address="0x0000000000000000000000000000000000000001">
				{#snippet loading()}
					<div class="custom-loading">Loading ENS data...</div>
				{/snippet}
			</EthereumIdentity>

			<!-- Custom Error -->
			<EthereumIdentity address="invalid-address">
				{#snippet error()}
					<div class="custom-error">Invalid address</div>
				{/snippet}
			</EthereumIdentity>
		</div>
	</section>

	<!-- Interactive Demo -->
	<section>
		<h3>Interactive Demo</h3>
		<div class="controls">
			<label>
				Address:
				<input type="text" bind:value={customAddress} placeholder="Enter Ethereum address" />
			</label>

			<label>
				Address Mode:
				<select bind:value={addressMode}>
					<option value="auto">Auto</option>
					<option value="full">Full</option>
					<option value="truncate">Truncate</option>
				</select>
			</label>

			<label>
				Truncate Chars:
				<input type="number" bind:value={truncateChars} min="2" max="10" />
			</label>

			<label>
				Text Size:
				<select bind:value={textSize}>
					<option value="xs">XS</option>
					<option value="sm">SM</option>
					<option value="base">Base</option>
					<option value="lg">LG</option>
				</select>
			</label>

			<label>
				<input type="checkbox" bind:checked={showAvatar} />
				Show Avatar
			</label>

			<label>
				<input type="checkbox" bind:checked={showAddress} />
				Show Address
			</label>

			<label>
				<input type="checkbox" bind:checked={showCopyIcon} />
				Show Copy Icon
			</label>

			<label>
				<input type="checkbox" bind:checked={copyOnClick} />
				Copy on Click
			</label>

			<label>
				Avatar Size:
				<select bind:value={avatarSize}>
					<option value="xs">XS</option>
					<option value="sm">SM</option>
					<option value="md">MD</option>
					<option value="lg">LG</option>
					<option value="xl">XL</option>
				</select>
			</label>
		</div>

		{#if customAddress}
			<div class="demo-result">
				<EthereumIdentity
					address={customAddress}
					{showAvatar}
					{showAddress}
					{addressMode}
					{truncateChars}
					{copyOnClick}
					{showCopyIcon}
					{avatarSize}
					{textSize}
				/>
			</div>
		{/if}
	</section>
</div>

<style>
	.ethereum-identity-examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-6);
		background: var(--color-panel-1);
		border-radius: var(--radius-lg);
	}

	h3 {
		margin: 0;
		font-size: var(--text-lg);
		font-weight: var(--font-medium);
		color: var(--color-heading-2);
	}

	h4 {
		margin: 0;
		font-size: var(--text-base);
		font-weight: var(--font-medium);
	}

	.example-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--space-4);
	}

	.example-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.description {
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
	}

	.size-examples {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.variations {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: var(--space-4);
	}

	.variation-item {
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.variation-item h4 {
		margin-bottom: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.custom-layouts {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.custom-card {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.card-content {
		flex: 1;
	}

	.card-content h4 {
		margin-bottom: var(--space-1);
	}

	.card-content p {
		margin: 0;
		font-size: var(--text-sm);
		font-family: var(--font-family-mono);
		color: var(--color-muted-foreground);
	}

	.custom-inline {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-muted);
		border-radius: var(--radius-full);
	}

	.custom-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
		background: var(--color-primary);
		color: var(--color-background);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.states {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.custom-loading {
		color: var(--color-muted-foreground);
		font-style: italic;
	}

	.custom-error {
		color: var(--color-danger);
		font-size: var(--text-sm);
	}

	.controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.controls label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	input[type='text'] {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-family-mono);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
	}

	input[type='text']:focus {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	select {
		padding: var(--space-1) var(--space-2);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
	}

	.demo-result {
		margin-top: var(--space-4);
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.skeleton {
		background: var(--color-muted);
		border-radius: var(--radius);
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
