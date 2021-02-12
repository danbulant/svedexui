<script>
    import { onMount } from "svelte";
    import audioManager from "../classes/sfx";
    import { delay } from "../classes/utils";
    import Keyboard from "../classes/keyboard.js";

    const path = require("path");
    const electron = require("electron");
    const settingsDir = electron.remote.app.getPath("userData");
    const keyboardsDir = path.join(settingsDir, "keyboards");

    // offset 1210
    onMount(async () => {
        window.keyboard = new Keyboard({
            layout: path.join(keyboardsDir, window.settings.keyboard+".json"),
            container: "keyboard"
        });

        await delay(280); // 1490
        document.getElementById("keyboard").setAttribute("style", "overflow: hidden;");
        document.getElementById("keyboard").setAttribute("class", "animation_state_1");
        audioManager.keyboard.play();

        await delay(100); // 1590
        document.getElementById("keyboard").setAttribute("class", "animation_state_1 animation_state_2");
    });
</script>

<section id="keyboard" style="opacity:0; overflow: hidden;">
</section>