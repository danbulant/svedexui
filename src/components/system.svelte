<script>
    import { onMount } from "svelte";
    import audioManager from "../classes/sfx";
    import { delay } from "../classes/utils";
    import Clock from "./system/clock.svelte";

    var activated = false
    onMount(async () => {
        await delay(3090);
        activated = true;
    });
</script>

<section class="mod_column" class:activated id="mod_column_left">
    <h3 class="title"><p>PANEL</p><p>SYSTEM</p></h3>
    <Clock offset={0} />
</section>