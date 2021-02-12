<script>
    import { onMount } from "svelte";
    import audioManager from "../classes/sfx";
    import { delay } from "../classes/utils";
    import Clock from "./system/clock.svelte";
    import CpuInfo from "./system/cpuInfo.svelte";
    import HardwareInspector from "./system/hardwareInspector.svelte";
    import RamWatcher from "./system/ramWatcher.svelte";
    import Sysinfo from "./system/sysinfo.svelte";
    import TopList from "./system/topList.svelte";

    var activated = false
    onMount(async () => {
        await delay(3090);
        activated = true;
    });
</script>

<section class="mod_column" class:activated id="mod_column_left">
    <h3 class="title"><p>PANEL</p><p>SYSTEM</p></h3>
    <Clock offset={0} />
    <Sysinfo offset={1} />
    <HardwareInspector offset={2} />
    <CpuInfo offset={3} />
    <RamWatcher offset={4} />
    <TopList offset={5} />
</section>