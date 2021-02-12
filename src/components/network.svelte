<script>
    import { onMount } from "svelte";
    import audioManager from "../classes/sfx";
    import { delay } from "../classes/utils";
    import Conninfo from "./network/conninfo.svelte";
    import LocationGlobe from "./network/locationGlobe.svelte";
    import Netstat from "./network/netstat.svelte";
    // import Audio from "./system/audio.svelte";

    var activated = false
    onMount(async () => {
        await delay(3090);
        activated = true;
    });
</script>

<section class="mod_column" class:activated id="mod_column_right">
    <h3 class="title"><p>PANEL</p><p>NETWORK</p></h3>
    <Netstat offset={0} />
    <LocationGlobe offset={1} />
    <!-- <Audio offset={1} /> -->
    <Conninfo offset={2} />
</section>