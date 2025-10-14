<script lang="ts">
	import { LangToggle, ThemeToggle } from '$lib/components/index.js';
	import ModalExamples from '$lib/components/modal.examples.svelte';
	import AvatarExamples from '$lib/components/avatar.examples.svelte';
	import AddressDisplayExamples from '$lib/components/address-display.examples.svelte';
	import EthereumIdentityExamples from '$lib/components/ethereum-identity.examples.svelte';
	import ChainIconExamples from '$lib/components/chain-icon.examples.svelte';
	import WalletListExamples from '$lib/components/wallet-list.examples.svelte';
	import ConnectedButtonExamples from '$lib/components/connected-button.examples.svelte';
	import ConnectorDemoExamples from '$lib/components/connector-demo.examples.svelte';
</script>

<div class="container">
	<header>
		<h1>ConnectKit Components</h1>
		<div class="header-actions">
			<ThemeToggle />
			<LangToggle />
		</div>
	</header>

	<section class="component-section">
		<h2>Modal Component</h2>
		<ModalExamples />
	</section>
	<section class="component-section">
		<h2>Avatar Component</h2>
		<AvatarExamples />
	</section>

	<section class="component-section">
		<h2>Address Display</h2>
		<AddressDisplayExamples />
	</section>

	<section class="component-section">
		<h2>Ethereum Identity</h2>
		<EthereumIdentityExamples />
	</section>

	<section class="component-section">
		<h2>Chain Icon</h2>
		<ChainIconExamples />
	</section>

	<section class="component-section">
		<h2>Wallet List</h2>
		<WalletListExamples />
	</section>

	<section class="component-section">
		<h2>Connected Button & Account Modal</h2>
		<ConnectedButtonExamples />
	</section>

	<section class="component-section">
		<h2>Complete Wallet Connector System</h2>
		<ConnectorDemoExamples />
	</section>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: var(--space-8);
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-12);
		padding-bottom: var(--space-6);
		border-bottom: 1px solid var(--color-border);
	}

	h1 {
		font-size: var(--text-3xl);
		font-weight: var(--font-bold);
		margin: 0;
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	.component-section {
		margin-bottom: var(--space-16);
	}

	.component-section h2 {
		font-size: var(--text-2xl);
		font-weight: var(--font-semibold);
		margin-bottom: var(--space-6);
	}

	@media (max-width: 640px) {
		.container {
			padding: var(--space-4);
		}

		header {
			flex-direction: column;
			align-items: flex-start;
			gap: var(--space-4);
		}
	}
</style>
