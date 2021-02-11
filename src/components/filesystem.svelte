<script>
    import { onMount } from "svelte";
    import audioManager from "../classes/sfx";
    import { delay, formatBytes } from "../classes/utils";
    import fs from "../stores/filesystem";
    import edexIconsGetter from "../data/edexIcons";

    var openFs = false;
    /** @type {ReturnType<edexIconsGetter>}*/
    var edexIcons;
    // Start offset 1210
    onMount(async () => {
        await delay(280); // 1490
        document.getElementById("filesystem").setAttribute("style", "");
        await delay(1800); // 3290
        openFs = true;
        edexIcons = edexIconsGetter();
        await delay(10); // rerender
        await delay(200); // 3490
        document.getElementById("filesystem").setAttribute("style", "opacity: 1;");
    });

    $: console.log($fs);
</script>

<section id="filesystem" style="width: 0px;" class="{window.settings.hideDotfiles ? "hideDotfiles" : ""} {window.settings.fsListView ? "list-view" : ""}">
    {#if openFs}
        {#if $fs.state === 1}
            <h3 class="title"><p>FILESYSTEM</p><p id="fs_disp_title_dir">EXECUTION FAILED</p></h3>
            <h2 id="fs_disp_error">CANNOT ACCESS CURRENT WORKING DIRECTORY</h2>
        {:else}
            <h3 class="title"><p>FILESYSTEM{$fs.detached ? "TRACKING FAILED, RUNNING DETACHED FROM TTY":""}</p><p id="fs_disp_title_dir">{$fs.diskView ? "Showing available block devices" : $fs.path}</p></h3>
            <div id="fs_disp_container">
            </div>
            <div id="fs_space_bar">
                <h1>EXIT DISPLAY</h1>
                <h3>{$fs.diskUsage + "%" || "Calculating available space..."}</h3><progress value={$fs.diskUage || 100} max="100"></progress>
            </div>
        {/if}
    {/if}
</section>