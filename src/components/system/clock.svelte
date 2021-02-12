<script>
    import { onMount } from "svelte";
    import audioManager from "../../classes/sfx";
    import { delay } from "../../classes/utils";

    export var offset = 0;
    var active = false;
    var twelveHours = (window.settings.clockHours === 12);
    var lastTime = new Date();

    updateClock();
    var updater = setInterval(() => {
        updateClock();
    }, 1000);

    var array = []
    function updateClock() {
        let time = new Date();
        array = [time.getHours(), time.getMinutes(), time.getSeconds()];

        // 12-hour mode translation
        if (twelveHours) {
            var ampm = (array[0] >= 12) ? "PM" : "AM";
            if (array[0] > 12) array[0] = array[0] - 12;
            if (array[0] === 0) array[0] = 12;
        }

        array.forEach((e, i) => {
            if (e.toString().length !== 2) {
                array[i] = "0"+e;
            }
        });
        array = array.join("").split("");
        if (twelveHours) array.push(ampm)

        lastTime = time;
    }

    onMount(async () => {
        await delay(3090 + 500 * (offset + 1));
        active = true;
        audioManager.panels.play();
    });
</script>

<div id="mod_clock" class="{(twelveHours) ? "mod_clock_twelve" : ""}" style="animation-play-state: {active ? "running" : "paused"};">
    <h1 id="mod_clock_text"><span>{array[0]}</span><span>{array[1]}</span><em>:</em><span>{array[2]}</span><span>{array[3]}</span><em>:</em><span>{array[4]}</span><span>{array[5]}</span>{#if twelveHours}<span>{array[6]}</span>{/if}</h1>
</div>