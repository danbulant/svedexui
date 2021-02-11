<script>
    import { onMount } from "svelte";
    import audioManager from "../classes/sfx";
    import { delay } from "../classes/utils";

    // Start offset 1210
    onMount(async () => {
        await delay(280); // 1490
        document.getElementById("filesystem").setAttribute("style", "");
        await delay(2000); // 3490
        document.getElementById("filesystem").setAttribute("style", "opacity: 1;");
    });
</script>
<section id="filesystem" style="width: 0px;" class="{window.settings.hideDotfiles ? "hideDotfiles" : ""} {window.settings.fsListView ? "list-view" : ""}">
</section>