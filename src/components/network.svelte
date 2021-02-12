<script>
    import { onMount } from "svelte";
    import audioManager from "../classes/sfx";
    import { delay } from "../classes/utils";

    var activated = false
    onMount(async () => {
        await delay(3090);
        activated = true;
    });
</script>

<section class="mod_column" class:activated id="mod_column_right">
    <h3 class="title"><p>PANEL</p><p>NETWORK</p></h3>
</section>