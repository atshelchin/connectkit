<script lang="ts">
	import ThemeToggle from '../lib/components/theme-toggle.svelte';
</script>

<div class="theme-toggle-examples">
	<div class="demo-box">
		<div class="theme-demos">
			<div class="demo-item">
				<h3>Sizes</h3>
				<div class="demo-row">
					<ThemeToggle size="sm" />
					<ThemeToggle size="md" />
					<ThemeToggle size="lg" />
				</div>
			</div>

			<div class="demo-item">
				<h3>With Labels</h3>
				<div class="demo-row">
					<ThemeToggle showLabel={true} labelPosition="left" />
					<ThemeToggle showLabel={true} labelPosition="right" />
				</div>
			</div>

			<div class="demo-item">
				<h3>Combinations</h3>
				<div class="demo-row">
					<ThemeToggle size="sm" showLabel={true} labelPosition="right" />
					<ThemeToggle size="lg" showLabel={true} labelPosition="left" />
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.theme-toggle-examples {
		width: 100%;
	}

	.demo-box {
		padding: var(--space-8);
		background: var(--color-panel-1);
		border-radius: var(--radius-lg);
		min-height: 120px;
	}

	.theme-demos {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		width: 100%;
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
		gap: var(--space-6);
		flex-wrap: wrap;
	}

	@media (max-width: 640px) {
		.demo-box {
			padding: var(--space-4);
		}

		.demo-row {
			gap: var(--space-4);
		}
	}
</style>
