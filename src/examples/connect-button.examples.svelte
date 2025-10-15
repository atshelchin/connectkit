<script lang="ts">
	import ConnectButton from '../lib/components/connect-button.svelte';
</script>

<div class="connect-button-examples">
	<div class="demo-box">
		<div class="demo-item">
			<h3>Default Connect Button</h3>
			<div class="demo-row">
				<ConnectButton />
			</div>
		</div>

		<div class="demo-item">
			<h3>Multiple Instances</h3>
			<div class="demo-row">
				<ConnectButton />
				<ConnectButton />
			</div>
			<p class="demo-note">Multiple buttons can be used on the same page</p>
		</div>
	</div>
</div>

<style>
	.connect-button-examples {
		width: 100%;
	}

	.demo-box {
		padding: var(--space-8);
		background: var(--color-panel-1);
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		min-height: 120px;
	}

	.demo-item h3 {
		margin: 0 0 var(--space-4) 0;
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
		color: var(--color-muted-foreground);
	}

	.demo-row {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		flex-wrap: wrap;
	}

	.demo-note {
		margin-top: var(--space-3);
		font-size: var(--text-sm);
		color: var(--color-muted-foreground);
	}

	@media (max-width: 640px) {
		.demo-box {
			padding: var(--space-4);
		}
	}
</style>
