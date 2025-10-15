<script lang="ts">
	import Modal from '../lib/components/modal.svelte';

	// Modal states
	let basicModal = $state(false);
	let noOverlayModal = $state(false);
	let footerModal = $state(false);
	let longContentModal = $state(false);

	// Ref for scrollable content
	let scrollableContent: HTMLElement;

	// Custom props state
	let customProps = $state({
		open: false,
		title: 'Custom Modal',
		size: 'md' as 'sm' | 'md' | 'lg' | 'xl',
		closeOnOverlay: true,
		closeOnEsc: true
	});

	// Demo content
	const longContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
	Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
	Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
	Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
	Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

	// Generate very long content for scroll demo
	const veryLongContent = Array.from(
		{ length: 50 },
		(_, i) => `
		<h3>Section ${i + 1}</h3>
		<p>This is paragraph ${i + 1} of the long content. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
		Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
		quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
		<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
		Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
		<ul>
			<li>List item 1 for section ${i + 1}</li>
			<li>List item 2 for section ${i + 1}</li>
			<li>List item 3 for section ${i + 1}</li>
		</ul>
	`
	).join('');

	function handleConfirm() {
		console.log('Confirmed!');
		footerModal = false;
	}
</script>

<div class="modal-examples">
	<!-- Interactive Props Control -->
	<div class="controls">
		<h3>Interactive Props Control</h3>
		<div class="control-grid">
			<label>
				Title:
				<input type="text" bind:value={customProps.title} />
			</label>

			<label>
				Size:
				<select bind:value={customProps.size}>
					<option value="sm">Small (sm)</option>
					<option value="md">Medium (md)</option>
					<option value="lg">Large (lg)</option>
					<option value="xl">Extra Large (xl)</option>
				</select>
			</label>

			<label>
				<input type="checkbox" bind:checked={customProps.closeOnOverlay} />
				Close on Overlay Click
			</label>

			<label>
				<input type="checkbox" bind:checked={customProps.closeOnEsc} />
				Close on ESC Key
			</label>

			<button class="btn btn-primary" onclick={() => (customProps.open = true)}>
				Open Custom Modal
			</button>
		</div>
	</div>

	<!-- Modal Examples -->
	<div class="examples">
		<h3>Examples</h3>
		<div class="button-grid">
			<button class="btn" onclick={() => (basicModal = true)}> Basic Modal </button>

			<button class="btn" onclick={() => (footerModal = true)}> Modal with Footer </button>

			<button class="btn" onclick={() => (noOverlayModal = true)}> No Overlay Close </button>

			<button class="btn" onclick={() => (longContentModal = true)}>
				Long Content (Scrollable)
			</button>
		</div>
	</div>
</div>

<!-- Modals -->

<!-- Basic Modal -->
<Modal bind:open={basicModal} title="Basic Modal" size="md">
	<p>This is a basic modal with default settings.</p>
	<p>{longContent}</p>
</Modal>

<!-- Custom Props Modal -->
<Modal
	bind:open={customProps.open}
	title={customProps.title}
	size={customProps.size}
	closeOnOverlay={customProps.closeOnOverlay}
	closeOnEsc={customProps.closeOnEsc}
>
	<div class="custom-content">
		<h4>Current Props:</h4>
		<pre>{JSON.stringify(
				{
					title: customProps.title,
					size: customProps.size,
					closeOnOverlay: customProps.closeOnOverlay,
					closeOnEsc: customProps.closeOnEsc
				},
				null,
				2
			)}</pre>
		<p style="margin-top: 1rem;">{longContent}</p>
	</div>
</Modal>

<!-- Modal with Footer -->
<Modal bind:open={footerModal} title="Confirm Action" size="sm">
	<p>Are you sure you want to proceed with this action?</p>
	<p class="warning">This action cannot be undone.</p>

	{#snippet footer()}
		<button class="btn btn-secondary" onclick={() => (footerModal = false)}> Cancel </button>
		<button class="btn btn-primary" onclick={handleConfirm}> Confirm </button>
	{/snippet}
</Modal>

<!-- No Overlay Close Modal -->
<Modal bind:open={noOverlayModal} title="Persistent Modal" size="md" closeOnOverlay={false}>
	<p>This modal cannot be closed by clicking the overlay.</p>
	<p>You must use the close button or press ESC key.</p>
	<div class="info-box">
		<strong>Note:</strong> closeOnOverlay is set to false
	</div>
</Modal>

<!-- Long Content Modal with Scrolling -->
<Modal bind:open={longContentModal} title="Long Content Example" size="lg">
	<div class="long-content-wrapper" bind:this={scrollableContent}>
		<div class="info-box" style="margin-bottom: var(--space-4);">
			<strong>📜 Scroll Demo:</strong> This modal contains a lot of content to demonstrate internal scrolling.
			The modal body will show a scrollbar while the background remains locked.
		</div>

		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html veryLongContent}

		<div class="info-box" style="margin-top: var(--space-6);">
			<strong>🎉 You've reached the end!</strong> The modal body successfully scrolled while keeping
			the modal header and footer (if present) in fixed positions.
		</div>
	</div>

	{#snippet footer()}
		<button class="btn btn-secondary" onclick={() => (longContentModal = false)}> Close </button>
		<button
			class="btn btn-primary"
			onclick={() => {
				// Find the modal-body element and scroll it
				const modalBody = scrollableContent?.closest('.modal-body');
				if (modalBody) {
					modalBody.scrollTo({ top: 0, behavior: 'smooth' });
				}
			}}
		>
			Scroll to Top
		</button>
	{/snippet}
</Modal>

<style>
	.modal-examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.controls {
		background: var(--color-panel-1);
		padding: var(--space-6);
		border-radius: var(--radius-lg);
	}

	.controls h3 {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		margin: 0 0 var(--space-4) 0;
	}

	.control-grid {
		display: grid;
		gap: var(--space-4);
		max-width: 600px;
	}

	.control-grid label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
	}

	.control-grid input[type='text'],
	.control-grid select {
		flex: 1;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-background);
		color: var(--color-foreground);
		font-size: var(--text-sm);
	}

	.control-grid input[type='checkbox'] {
		width: 1.25rem;
		height: 1.25rem;
	}

	.examples h3 {
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		margin: 0 0 var(--space-4) 0;
	}

	.button-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.btn {
		padding: var(--space-2-5) var(--space-5);
		border-radius: var(--radius);
		font-size: var(--text-sm);
		font-weight: var(--font-medium);
		border: 1px solid var(--color-border);
		background: var(--color-background);
		color: var(--color-foreground);
		cursor: pointer;
		transition: all 150ms ease;
	}

	/* .btn:hover {
		background: var(--color-muted);
	} */

	.btn:focus-visible {
		outline: 2px solid var(--color-ring);
		outline-offset: 2px;
	}

	.btn-primary {
		background: var(--color-button-primary);
		color: var(--color-button-primary-foreground);
		border-color: var(--color-button-primary);
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-secondary {
		background: var(--color-button-secondary);
		color: var(--color-button-secondary-foreground);
		border-color: var(--color-border);
	}

	.custom-content h4 {
		margin: 0 0 var(--space-3) 0;
		font-size: var(--text-base);
		font-weight: var(--font-semibold);
	}

	.custom-content pre {
		background: var(--color-panel-1);
		padding: var(--space-3);
		border-radius: var(--radius);
		font-family: var(--font-family-mono);
		font-size: var(--text-sm);
		overflow-x: auto;
	}

	.long-content-wrapper {
		/* Ensure content is readable */
		line-height: 1.6;
	}

	.long-content-wrapper :global(h3) {
		margin-top: var(--space-6);
		margin-bottom: var(--space-3);
		font-size: var(--text-lg);
		font-weight: var(--font-semibold);
		color: var(--color-heading-1);
	}

	.long-content-wrapper :global(p) {
		margin-bottom: var(--space-4);
		color: var(--color-foreground);
	}

	.long-content-wrapper :global(ul) {
		margin-bottom: var(--space-4);
		padding-left: var(--space-6);
	}

	.long-content-wrapper :global(li) {
		margin-bottom: var(--space-2);
		color: var(--color-muted-foreground);
	}

	.warning {
		color: var(--color-danger);
		font-size: var(--text-sm);
		margin-top: var(--space-3);
	}

	.info-box {
		background: var(--color-panel-accent);
		padding: var(--space-3);
		border-radius: var(--radius);
		margin-top: var(--space-4);
		font-size: var(--text-sm);
	}

	@media (max-width: 640px) {
		.control-grid {
			gap: var(--space-3);
		}
	}
</style>
