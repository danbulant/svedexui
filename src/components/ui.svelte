<script>
    import MainShell from "./mainShell.svelte";
    import System from "./system.svelte";
    import Network from "./network.svelte";
    import Filesystem from "./filesystem.svelte";
    import Keyboard from "./keyboard.svelte";
    import { onMount } from "svelte";
    import { delay } from "../classes/utils";

    var openFs = false;
    onMount(async() => {
        await delay(1210);
        openFs = true;
    });
</script>

<System />
<MainShell />
<Network />

{#if openFs}
    <Filesystem />
    <Keyboard />
{/if}