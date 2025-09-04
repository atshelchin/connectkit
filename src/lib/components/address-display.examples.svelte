<script lang="ts">
	import AddressDisplay from './address-display.svelte';

	// Example addresses
	const addresses = [
		{
			address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
			ensName: 'vitalik.eth',
			description: 'With ENS name'
		},
		{
			address: '0x983110309620D911731Ac0932219af06091b6744',
			ensName: null,
			description: 'Without ENS name'
		},
		{
			address: '0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72',
			ensName: 'ens.eth',
			description: 'Short ENS name'
		}
	];

	// Interactive demo state
	let customAddress = $state('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
	let customEnsName = $state<string | null>('vitalik.eth');
	let displayMode = $state<'auto' | 'full' | 'truncate'>('auto');
	let truncateChars = $state(4);
	let copyOnClick = $state(true);
	let showCopyIcon = $state(false);
	let showTooltip = $state(true);
	let size = $state<'xs' | 'sm' | 'base' | 'lg'>('base');
</script>

<div class="address-display-examples">
	<!-- Basic Examples -->
	<section>
		<h3>Basic Usage</h3>
		<div class="example-grid">
			{#each addresses as item (item.address)}
				<div class="example-item">
					<AddressDisplay address={item.address} ensName={item.ensName} />
					<span class="description">{item.description}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Display Modes -->
	<section>
		<h3>Display Modes</h3>
		<div class="modes-grid">
			<div class="mode-item">
				<h4>Auto (default)</h4>
				<p>Truncates when text overflows container</p>
				<div class="constrained-container">
					<AddressDisplay address={addresses[1].address} mode="auto" />
				</div>
			</div>

			<div class="mode-item">
				<h4>Full</h4>
				<p>Always shows full address</p>
				<div class="constrained-container">
					<AddressDisplay address={addresses[1].address} mode="full" />
				</div>
			</div>

			<div class="mode-item">
				<h4>Truncate</h4>
				<p>Always truncated</p>
				<div class="constrained-container">
					<AddressDisplay address={addresses[1].address} mode="truncate" />
				</div>
			</div>
		</div>
	</section>

	<!-- Sizes -->
	<section>
		<h3>Text Sizes</h3>
		<div class="size-examples">
			<div class="size-item">
				<AddressDisplay address={addresses[0].address} ensName={addresses[0].ensName} size="xs" />
				<span>xs</span>
			</div>
			<div class="size-item">
				<AddressDisplay address={addresses[0].address} ensName={addresses[0].ensName} size="sm" />
				<span>sm</span>
			</div>
			<div class="size-item">
				<AddressDisplay address={addresses[0].address} ensName={addresses[0].ensName} size="base" />
				<span>base</span>
			</div>
			<div class="size-item">
				<AddressDisplay address={addresses[0].address} ensName={addresses[0].ensName} size="lg" />
				<span>lg</span>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section>
		<h3>Features</h3>
		<div class="features-grid">
			<div class="feature-item">
				<h4>With Copy Icon</h4>
				<AddressDisplay
					address={addresses[0].address}
					ensName={addresses[0].ensName}
					showCopyIcon={true}
				/>
			</div>

			<div class="feature-item">
				<h4>No Copy on Click</h4>
				<AddressDisplay
					address={addresses[0].address}
					ensName={addresses[0].ensName}
					copyOnClick={false}
				/>
			</div>

			<div class="feature-item">
				<h4>Custom Truncation</h4>
				<AddressDisplay address={addresses[1].address} mode="truncate" truncateChars={6} />
			</div>

			<div class="feature-item">
				<h4>No Tooltip</h4>
				<AddressDisplay
					address={addresses[0].address}
					ensName={addresses[0].ensName}
					showTooltip={false}
				/>
			</div>
		</div>
	</section>

	<!-- Responsive Behavior -->
	<section>
		<h3>Responsive Truncation (Auto Mode)</h3>
		<p class="section-description">
			In auto mode, the component automatically truncates when the container width is too small. Try
			resizing your browser to see the effect.
		</p>
		<div class="responsive-demo">
			<div class="resize-container">
				<AddressDisplay address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" mode="auto" />
			</div>
			<div class="resize-container narrow">
				<AddressDisplay address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" mode="auto" />
			</div>
			<div class="resize-container very-narrow">
				<AddressDisplay address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" mode="auto" />
			</div>
		</div>
	</section>

	<!-- ENS Name Priority -->
	<section>
		<h3>ENS Name Priority</h3>
		<p class="section-description">
			When an ENS name is provided, it takes priority over the address display.
		</p>
		<div class="ens-examples">
			<div class="ens-item">
				<h4>ENS Name Only</h4>
				<AddressDisplay address={addresses[0].address} ensName="vitalik.eth" />
			</div>

			<div class="ens-item">
				<h4>Long ENS Name</h4>
				<AddressDisplay
					address={addresses[0].address}
					ensName="verylongensnamethatshouldoverflow.eth"
				/>
			</div>

			<div class="ens-item">
				<h4>ENS with Icon</h4>
				<AddressDisplay address={addresses[0].address} ensName="vitalik.eth" showCopyIcon={true} />
			</div>
		</div>
	</section>

	<!-- Interactive Demo -->
	<section>
		<h3>Interactive Demo</h3>
		<div class="controls">
			<div class="control-group">
				<label>
					Address:
					<input type="text" bind:value={customAddress} placeholder="0x..." />
				</label>
			</div>

			<div class="control-group control-group--with-button">
				<label>
					ENS Name (optional):
					<input type="text" bind:value={customEnsName} placeholder="name.eth" />
				</label>
				<button onclick={() => (customEnsName = null)}> Clear ENS </button>
			</div>

			<div class="control-row">
				<label>
					Mode:
					<select bind:value={displayMode}>
						<option value="auto">Auto</option>
						<option value="full">Full</option>
						<option value="truncate">Truncate</option>
					</select>
				</label>

				<label>
					Size:
					<select bind:value={size}>
						<option value="xs">XS</option>
						<option value="sm">SM</option>
						<option value="base">Base</option>
						<option value="lg">LG</option>
					</select>
				</label>

				<label>
					Truncate Chars:
					<input type="number" bind:value={truncateChars} min="2" max="10" />
				</label>
			</div>

			<div class="control-row">
				<label>
					<input type="checkbox" bind:checked={copyOnClick} />
					Copy on Click
				</label>

				<label>
					<input type="checkbox" bind:checked={showCopyIcon} />
					Show Copy Icon
				</label>

				<label>
					<input type="checkbox" bind:checked={showTooltip} />
					Show Tooltip
				</label>
			</div>
		</div>

		<div class="demo-result">
			<AddressDisplay
				address={customAddress}
				ensName={customEnsName}
				mode={displayMode}
				{truncateChars}
				{copyOnClick}
				{showCopyIcon}
				{showTooltip}
				{size}
			/>
		</div>
	</section>

	<!-- Custom Styling -->
	<section>
		<h3>Custom Styling</h3>
		<div class="custom-styles">
			<AddressDisplay
				address={addresses[0].address}
				ensName={addresses[0].ensName}
				class="custom-primary"
			/>

			<AddressDisplay address={addresses[1].address} class="custom-success" showCopyIcon={true} />

			<AddressDisplay
				address={addresses[2].address}
				ensName={addresses[2].ensName}
				class="custom-gradient"
			/>
		</div>
	</section>
</div>

<style>
	.address-display-examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	h2 {
		margin: 0;
		font-size: var(--text-2xl);
		font-weight: var(--font-semibold);
		color: var(--color-heading-1);
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
		color: var(--color-heading-3);
	}

	.section-description {
		color: var(--color-muted-foreground);
		font-size: var(--text-sm);
		margin: 0;
	}

	.example-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

	.modes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.mode-item {
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.mode-item p {
		margin: var(--space-2) 0;
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
	}

	.constrained-container {
		width: 180px;
		padding: var(--space-2);
		background: var(--color-muted);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.size-examples {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		flex-wrap: wrap;
	}

	.size-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}

	.size-item span {
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.feature-item {
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.feature-item h4 {
		margin-bottom: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.responsive-demo {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.resize-container {
		padding: var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		overflow: hidden;
		min-width: 150px; /* Ensure minimum width for usability */
	}

	.resize-container.narrow {
		width: 250px;
	}

	.resize-container.very-narrow {
		width: 180px;
	}

	.ens-examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-4);
	}

	.ens-item {
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.ens-item h4 {
		margin-bottom: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
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

	.control-group {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}

	.control-group label {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	/* Responsive wrapping for control group with button */
	.control-group--with-button {
		flex-wrap: wrap;
	}

	.control-group--with-button label {
		min-width: 250px;
		flex: 1 1 auto;
	}

	.control-group--with-button button {
		flex-shrink: 0;
	}

	@media (max-width: 480px) {
		.control-group--with-button {
			flex-direction: column;
			align-items: stretch;
		}

		.control-group--with-button button {
			width: 100%;
		}
	}

	.control-row {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.control-row label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
	}

	input[type='text'],
	input[type='number'] {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-family-mono);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
	}

	input[type='number'] {
		width: 80px;
		flex: none;
	}

	input[type='text']:focus,
	input[type='number']:focus,
	select:focus {
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

	button {
		padding: var(--space-2) var(--space-3);
		font-size: var(--text-sm);
		background: var(--color-muted);
		color: var(--color-foreground);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: background 150ms ease;
	}

	button:hover {
		background: var(--color-muted-foreground);
		color: var(--color-background);
	}

	.demo-result {
		margin-top: var(--space-4);
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		display: flex;
		justify-content: center;
	}

	.custom-styles {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	/* Custom style examples */
	:global(.custom-primary) {
		color: var(--color-primary) !important;
	}

	:global(.custom-success) {
		color: var(--color-success) !important;
		background: var(--color-success-soft);
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-full);
	}

	:global(.custom-gradient) {
		background: linear-gradient(90deg, #667eea, #f56565);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
</style>
