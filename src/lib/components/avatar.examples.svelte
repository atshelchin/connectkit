<script lang="ts">
	import Avatar from './avatar.svelte';

	// Example addresses
	const exampleAddresses = [
		{
			address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // vitalik.eth
			label: 'vitalik.eth'
		},
		{
			address: '0x983110309620D911731Ac0932219af06091b6744', // brantly.eth
			label: 'brantly.eth'
		},
		{
			address: '0x1234567890123456789012345678901234567890',
			label: 'Random Address 1'
		},
		{
			address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
			label: 'Random Address 2'
		},
		{
			address: '0x0000000000000000000000000000000000000000',
			label: 'Zero Address'
		}
	];

	// Interactive controls
	let customAddress = $state('');
	let selectedSize = $state<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
	let rounded = $state(true);
</script>

<div class="avatar-examples">
	<!-- Size Examples -->
	<section>
		<h3>Sizes</h3>
		<div class="size-examples">
			<div class="example-item">
				<Avatar address={exampleAddresses[0].address} size="xs" />
				<span>xs (24px)</span>
			</div>
			<div class="example-item">
				<Avatar address={exampleAddresses[0].address} size="sm" />
				<span>sm (32px)</span>
			</div>
			<div class="example-item">
				<Avatar address={exampleAddresses[0].address} size="md" />
				<span>md (40px)</span>
			</div>
			<div class="example-item">
				<Avatar address={exampleAddresses[0].address} size="lg" />
				<span>lg (48px)</span>
			</div>
			<div class="example-item">
				<Avatar address={exampleAddresses[0].address} size="xl" />
				<span>xl (64px)</span>
			</div>
		</div>
	</section>

	<!-- Shape Examples -->
	<section>
		<h3>Shapes</h3>
		<div class="shape-examples">
			<div class="example-item">
				<Avatar address={exampleAddresses[1].address} size="lg" rounded={true} />
				<span>Rounded</span>
			</div>
			<div class="example-item">
				<Avatar address={exampleAddresses[1].address} size="lg" rounded={false} />
				<span>Square</span>
			</div>
		</div>
	</section>

	<!-- Different Addresses -->
	<section>
		<h3>Different Address Patterns</h3>
		<div class="address-grid">
			{#each exampleAddresses as example (example.address)}
				<div class="address-item">
					<Avatar address={example.address} size="lg" />
					<div class="address-info">
						<span class="address-label">{example.label}</span>
						<code class="address-code"
							>{example.address.slice(0, 6)}...{example.address.slice(-4)}</code
						>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Interactive Example -->
	<section>
		<h3>Interactive Example</h3>
		<div class="interactive-controls">
			<div class="control-group">
				<label>
					Address:
					<input
						type="text"
						bind:value={customAddress}
						placeholder="Enter Ethereum address (0x...)"
						class="address-input"
					/>
				</label>
			</div>

			<div class="control-group">
				<label>
					Size:
					<select bind:value={selectedSize}>
						<option value="xs">Extra Small</option>
						<option value="sm">Small</option>
						<option value="md">Medium</option>
						<option value="lg">Large</option>
						<option value="xl">Extra Large</option>
					</select>
				</label>
			</div>

			<div class="control-group">
				<label>
					<input type="checkbox" bind:checked={rounded} />
					Rounded
				</label>
			</div>

			{#if customAddress}
				<div class="preview">
					<Avatar address={customAddress} size={selectedSize} {rounded} />
					<div class="preview-info">
						<p>Address: <code>{customAddress}</code></p>
						<p>Size: {selectedSize}</p>
						<p>Shape: {rounded ? 'Rounded' : 'Square'}</p>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Group Example -->
	<section>
		<h3>Avatar Group</h3>
		<div class="avatar-group">
			{#each exampleAddresses.slice(0, 4) as example (example.address)}
				<Avatar address={example.address} size="md" />
			{/each}
		</div>
	</section>

	<!-- Loading State -->
	<section>
		<h3>States</h3>
		<div class="states-examples">
			<div class="example-item">
				<Avatar address="" size="lg" />
				<span>Empty Address</span>
			</div>
			<div class="example-item">
				<Avatar address="invalid-address" size="lg" />
				<span>Invalid Address</span>
			</div>
		</div>
	</section>
</div>

<style>
	.avatar-examples {
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

	.size-examples,
	.shape-examples,
	.states-examples {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		flex-wrap: wrap;
	}

	.example-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}

	.example-item span {
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.address-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.address-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.address-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
		min-width: 0;
	}

	.address-label {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
	}

	.address-code {
		font-size: var(--text-xs);
		font-family: var(--font-family-mono);
		color: var(--color-muted-foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.interactive-controls {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.control-group label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		color: var(--color-foreground);
	}

	.address-input {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-family-mono);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
	}

	.address-input:focus {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	select {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
		cursor: pointer;
	}

	select:focus {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	.preview {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.preview-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.preview-info p {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.preview-info code {
		font-family: var(--font-family-mono);
		color: var(--color-foreground);
	}

	.avatar-group {
		display: flex;
		align-items: center;
		/* Overlap avatars */
		margin-left: calc(var(--space-3) * -1);
	}

	.avatar-group > :global(*) {
		margin-left: calc(var(--space-3) * -1);
		border: 2px solid var(--color-background);
		transition: transform 150ms ease;
	}

	.avatar-group > :global(*:first-child) {
		margin-left: 0;
	}

	.avatar-group > :global(*:hover) {
		transform: translateY(-2px);
		z-index: 1;
	}
</style>
