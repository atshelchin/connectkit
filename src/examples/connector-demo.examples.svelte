<script>
	import ConnectorDemo from './connector-demo.svelte';
</script>

<div class="examples">
	<section>
		<ConnectorDemo />
	</section>
</div>

<style>
	.examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	section {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
</style>
