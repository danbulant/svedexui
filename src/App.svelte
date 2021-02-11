<script>
	import Boot from "./components/boot.svelte";
	import state from "./stores/state";
	import bootLog from "./stores/bootLog";
	import Modals from "./components/modals.svelte";
	import "./classes/boot";
	import Ui from "./components/ui.svelte";

	$bootLog += "Booting eDEX-UI...";
</script>

{#if $state.bootScreen}
	<Boot />
{:else}
	<Ui />
{/if}

<Modals />