<script>
    import { onMount } from "svelte";
    import audioManager from "../../classes/sfx";
    import { delay, shuffleArray } from "../../classes/utils";

    export var offset = 0;

    var active;
    onMount(async () => {
        await delay(3090 + 500 * (offset + 1));
        active = true;
        audioManager.panels.play();
    });

    /**
     * 0 = free
     * 1 = available
     * 2 = used/active
     *  @type {number[]} 
    */
    var points = [];

    for (var i = 0; i < 440; i++) {
        points.push(0);
    }

    var usingText = "";
    var swap = 0;
    var swapGib = "";
    function updateInfo() {
        window.si.mem().then(data => {
            if (data.free+data.used !== data.total) throw("RAM Watcher Error: Bad memory values");

            // Convert the data for the 440-points grid
            let active = Math.round((440*data.active)/data.total);
            let available = Math.round((440*(data.available-data.free))/data.total);

            // Update grid
            points.slice(0, active).forEach((a, i) => { points[i] = 2});
            points.slice(active, active+available).forEach((a, i) => { points[i] = 1});
            points.slice(active+available, points.length).forEach((a, i) => { points[i] = 0});
            points = shuffleArray(points);

            // Update info text
            let totalGiB = Math.round((data.total/1073742000)*10)/10; // 1073742000 bytes = 1 Gibibyte (GiB), the *10 is to round to .1 decimal
            let usedGiB = Math.round((data.active/1073742000)*10)/10;
            usingText = `USING ${usedGiB} OUT OF ${totalGiB} GiB`;

            // Update swap indicator
            let usedSwap = Math.round((100*data.swapused)/data.swaptotal);
            swap = usedSwap || 0;

            let usedSwapGiB = Math.round((data.swapused/1073742000)*10)/10;
            swapGib = `${usedSwapGiB} GiB`;
        });
    }


    updateInfo();
    var infoUpdater = setInterval(() => {
        updateInfo();
    }, 5000);
</script>

<div id="mod_ramwatcher_inner" style="animation-play-state: {active ? "running" : "paused"};">
    <h1>MEMORY<i id="mod_ramwatcher_info">{usingText}</i></h1>
    <div id="mod_ramwatcher_pointmap">
        {#each points as point}
            <div class="mod_ramwatcher_point" class:free={point === 0} class:available={point === 1} class:active={point === 2}></div>
        {/each}
    </div>
    <div id="mod_ramwatcher_swapcontainer">
        <h1>SWAP</h1>
        <progress id="mod_ramwatcher_swapbar" max="100" value={swap}></progress>
        <h3 id="mod_ramwatcher_swaptext">{swapGib}</h3>
    </div>
</div>