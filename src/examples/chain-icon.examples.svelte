<script lang="ts">
	import ChainIcon from '../lib/components/chain-icon.svelte';
	import { chainIcons } from '../lib/components/chain-icons.js';

	// Popular chains for showcase
	const popularChains = [
		{ id: 1, name: 'Ethereum' },
		{ id: 8453, name: 'Base' },
		{ id: 56, name: 'BNB Smart Chain' },
		{ id: 42161, name: 'Arbitrum' },
		{ id: 10, name: 'Optimism' },
		{ id: 137, name: 'Polygon' }
	];

	// Unsupported chains for testing
	const unsupportedChains = [
		{ id: 999999, name: 'Unknown Network 1' },
		{ id: 123456, name: 'Unknown Network 2' },
		{ id: 777, name: 'Test Network' },
		{ id: 130, name: 'Unichain ' }
	];

	// Interactive demo state
	let customChainId = $state(1);
	let selectedSize = $state<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
	let showWarning = $state(true);
	let showTooltip = $state(true);
</script>

<div class="chain-icon-examples">
	<!-- Popular Chains -->
	<section>
		<h3>Popular Chains</h3>
		<div class="chains-grid">
			{#each popularChains as chain (chain.id)}
				<div class="chain-item">
					<ChainIcon chainId={chain.id} size="lg" />
					<span class="chain-name">{chain.name}</span>
					<code class="chain-id">ID: {chain.id}</code>
				</div>
			{/each}
		</div>
	</section>

	<!-- All Sizes -->
	<section>
		<h3>Sizes</h3>
		<div class="size-examples">
			<div class="size-item">
				<ChainIcon chainId={1} size="xs" />
				<span>xs (16px)</span>
			</div>
			<div class="size-item">
				<ChainIcon chainId={1} size="sm" />
				<span>sm (20px)</span>
			</div>
			<div class="size-item">
				<ChainIcon chainId={1} size="md" />
				<span>md (24px)</span>
			</div>
			<div class="size-item">
				<ChainIcon chainId={1} size="lg" />
				<span>lg (32px)</span>
			</div>
			<div class="size-item">
				<ChainIcon chainId={1} size="xl" />
				<span>xl (40px)</span>
			</div>
		</div>
	</section>

	<!-- All Supported Chains -->
	<section>
		<h3>All Supported Chains</h3>
		<div class="all-chains">
			{#each Object.values(chainIcons) as chain (chain.chainId)}
				<div class="chain-badge">
					<ChainIcon chainId={chain.chainId} size="md" />
					<span>{chain.name}</span>
				</div>
			{/each}
		</div>
	</section>

	<!-- Unsupported Chains -->
	<section>
		<h3>Unsupported Chains</h3>
		<div class="unsupported-examples">
			{#each unsupportedChains as chain (chain.id)}
				<div class="chain-item">
					<ChainIcon chainId={chain.id} size="lg" showWarning={true} />
					<span class="chain-name">{chain.name}</span>
					<code class="chain-id">ID: {chain.id}</code>
				</div>
			{/each}
		</div>
		<div class="note">Unsupported chains show the default icon with an optional warning badge</div>
	</section>

	<!-- Warning Badge Control -->
	<section>
		<h3>Warning Badge</h3>
		<div class="warning-examples">
			<div class="example-item">
				<ChainIcon chainId={999999} size="lg" showWarning={true} />
				<span>With Warning</span>
			</div>
			<div class="example-item">
				<ChainIcon chainId={999999} size="lg" showWarning={false} />
				<span>Without Warning</span>
			</div>
		</div>
	</section>

	<!-- Interactive Demo -->
	<section>
		<h3>Interactive Demo</h3>
		<div class="interactive-controls">
			<div class="control-group">
				<label>
					Chain ID:
					<input type="number" bind:value={customChainId} min="1" class="chain-input" />
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
					<input type="checkbox" bind:checked={showWarning} />
					Show Warning Badge
				</label>
			</div>

			<div class="control-group">
				<label>
					<input type="checkbox" bind:checked={showTooltip} />
					Show Tooltip
				</label>
			</div>

			<div class="preview">
				<ChainIcon chainId={customChainId} size={selectedSize} {showWarning} {showTooltip} />
				<div class="preview-info">
					<p>Chain ID: {customChainId}</p>
					<p>Supported: {chainIcons[customChainId] ? 'Yes' : 'No'}</p>
					{#if chainIcons[customChainId]}
						<p>Name: {chainIcons[customChainId].name}</p>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Usage with Other Components -->
	<section>
		<h3>Usage Examples</h3>
		<div class="usage-examples">
			<!-- In a button -->
			<button class="chain-button">
				<ChainIcon chainId={1} size="sm" />
				<span>Ethereum</span>
			</button>

			<!-- In a dropdown item -->
			<div class="dropdown-item">
				<ChainIcon chainId={8453} size="md" />
				<div class="dropdown-content">
					<span class="dropdown-name">Base</span>
					<span class="dropdown-id">Chain ID: 8453</span>
				</div>
			</div>

			<!-- In a badge -->
			<div class="chain-badge-large">
				<ChainIcon chainId={137} size="xs" />
				<span>Polygon</span>
			</div>

			<!-- Chain switcher -->
			<div class="chain-switcher">
				<ChainIcon chainId={42161} size="md" />
				<span>Arbitrum</span>
				<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
					<path
						d="M3 5L6 8L9 5"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</div>
		</div>
	</section>
</div>

<style>
	.chain-icon-examples {
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

	.chains-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: var(--space-4);
	}

	.chain-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		transition: all 150ms ease;
	}

	.chain-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.chain-name {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
	}

	.chain-id {
		font-size: var(--text-xs);
		font-family: var(--font-family-mono);
		color: var(--color-muted-foreground);
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
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	.all-chains {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.chain-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
	}

	.unsupported-examples {
		display: flex;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.note {
		padding: var(--space-3);
		background: var(--color-muted);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
		font-style: italic;
	}

	.warning-examples {
		display: flex;
		gap: var(--space-6);
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

	.interactive-controls {
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

	.chain-input {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		font-family: var(--font-family-mono);
		font-size: var(--text-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
	}

	.chain-input:focus {
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
		margin-top: var(--space-4);
		padding: var(--space-4);
		background: var(--color-panel-1);
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

	.usage-examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}

	.chain-button {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		background: var(--color-primary);
		color: white;
		border: none;
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: opacity 150ms ease;
	}

	.chain-button:hover {
		opacity: 0.9;
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: background 150ms ease;
	}

	.dropdown-item:hover {
		background: var(--color-muted);
	}

	.dropdown-content {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		flex: 1;
	}

	.dropdown-name {
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		color: var(--color-foreground);
	}

	.dropdown-id {
		font-size: var(--text-xs);
		color: var(--color-muted-foreground);
	}

	.chain-badge-large {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
		background: var(--color-muted);
		border-radius: var(--radius-full);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.chain-switcher {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		background: var(--color-background);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		cursor: pointer;
		transition: all 150ms ease;
	}

	.chain-switcher:hover {
		background: var(--color-muted);
		border-color: var(--color-border-hover);
	}
</style>
