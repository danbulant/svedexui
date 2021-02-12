<script>
    import { onMount } from "svelte";
    import audioManager from "../../classes/sfx";
    import { delay } from "../../classes/utils";
    import { TimeSeries, SmoothieChart } from "smoothie";
    import { iface, offline } from "../../stores/netstat";
    import pb from "pretty-bytes";

    export var offset = 0;
    var active = false;
    var series = [];
    var charts = [];

    var ctop, cbottom;

    onMount(async () => {
        await delay(3090 + 500 * (offset + 1));
        active = true;
        audioManager.panels.play();

        // Set chart options
        let chartOptions = [{
            limitFPS: 40,
            responsive: true,
            millisPerPixel: 70,
            interpolation: 'linear',
            grid:{
                millisPerLine: 5000,
                fillStyle:'transparent',
                strokeStyle:`rgba(${window.theme.r},${window.theme.g},${window.theme.b},0.4)`,
                verticalSections:3,
                borderVisible:false
            },
            labels:{
                fontSize: 10,
                fillStyle: `rgb(${window.theme.r},${window.theme.g},${window.theme.b})`,
                precision: 2
            }
        }];
        chartOptions.push(Object.assign({}, chartOptions[0]));  // Deep copy object, see http://jsben.ch/bWfk9
        chartOptions[0].minValue = 0;
        chartOptions[1].maxValue = 0;

        // Create chart
        series = [new TimeSeries(), new TimeSeries()];
        charts = [new SmoothieChart(chartOptions[0]), new SmoothieChart(chartOptions[1])];

        charts[0].addTimeSeries(series[0], {lineWidth:1.7,strokeStyle:`rgb(${window.theme.r},${window.theme.g},${window.theme.b})`});
        charts[1].addTimeSeries(series[1], {lineWidth:1.7,strokeStyle:`rgb(${window.theme.r},${window.theme.g},${window.theme.b})`});

        charts[0].streamTo(ctop, 1000);
        charts[1].streamTo(cbottom, 1000);

        // Init updater
        updateInfo();
        var infoUpdater = setInterval(() => {
            updateInfo();
        }, 1000);

        return () => clearInterval(infoUpdater);
    });

    var total = "0B OUT, 0B IN";
    var current = "UP / DOWN, MB/S";
    function updateInfo() {
        let time = new Date().getTime();

        if ($offline || $iface === null) {
            series[0].append(time, 0);
            series[1].append(time, 0);
            return;
        } else {
            window.si.networkStats($iface).then(data => {

                let max0 = series[0].maxValue;
                let max1 = -series[1].minValue;
                if (max0 > max1) {
                    series[1].minValue = -max0;
                } else if (max1 > max0) {
                    series[0].maxValue = max1;
                }

                series[0].append(time, data[0].tx_sec/125000);
                series[1].append(time, -data[0].rx_sec/125000);

                total = `${pb(data[0].tx_bytes)} OUT, ${pb(data[0].rx_bytes)} IN`.toUpperCase();
                current = "UP " + parseFloat(data[0].tx_sec/125000).toFixed(2) + " DOWN " + parseFloat(data[0].rx_sec/125000).toFixed(2);
            });
        }
    }
</script>

<div id="mod_conninfo" class:offline={$offline} style="animation-play-state: {active ? "running" : "paused"};">
    <div id="mod_conninfo_innercontainer">
        <h1>NETWORK TRAFFIC<i>{current}</i></h1>
        <h2>TOTAL<i>{total}</i></h2>
        <canvas id="mod_conninfo_canvas_top" bind:this={ctop}></canvas>
        <canvas id="mod_conninfo_canvas_bottom" bind:this={cbottom}></canvas>
        <h3>OFFLINE</h3>
    </div>
</div>