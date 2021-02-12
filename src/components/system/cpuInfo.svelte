<script>
    import { onMount } from "svelte";
    import audioManager from "../../classes/sfx";
    import { delay } from "../../classes/utils";
    import { TimeSeries, SmoothieChart } from "smoothie";

    // let TimeSeries = require("smoothie").TimeSeries;
    // let SmoothieChart = require("smoothie").SmoothieChart;

    export var offset = 0;

    var active = false;
    onMount(async () => {
        await delay(3090 + 500 * (offset + 1));
        active = true;
        audioManager.panels.play();
    });

    var series = [];
    var charts = [];
    var divide;
    var cpuName;
    var data;

    var loadUpdater, speedUpdater, tasksUpdater, tempUpdater;
    window.si.cpu().then(async rdata => {
        data = rdata;
        divide = Math.floor(data.cores/2);

        cpuName = data.manufacturer+data.brand;
        cpuName = cpuName.substr(0, 30);
        // cpuName.substr(0, Math.min(cpuName.length, cpuName.lastIndexOf(" ")));
        await delay(10); // rerender

        for (var i = 0; i < 2; i++) {
            charts.push(new SmoothieChart({
                limitFPS: 15,
                responsive: true,
                millisPerPixel: 50,
                grid:{
                    fillStyle:'transparent',
                    strokeStyle:'transparent',
                    verticalSections:0,
                    borderVisible:false
                },
                labels:{
                    disabled: true
                },
                yRangeFunction: () => {
                    return {min:0,max:100};
                }
            }));
        }

        for (var i = 0; i < data.cores; i++) {
            // Create TimeSeries
            series.push(new TimeSeries());

            let serie = series[i];
            let options = {
                lineWidth: 1.7,
                strokeStyle: `rgb(${window.theme.r},${window.theme.g},${window.theme.b})`
            };

            if (i < divide) {
                charts[0].addTimeSeries(serie, options);
            } else {
                charts[1].addTimeSeries(serie, options);
            }
        }

        for (var i = 0; i < 2; i++) {
            charts[i].streamTo(document.getElementById(`mod_cpuinfo_canvas_${i}`), 2010);
        }

        // Init updater
        updateCPUload();
        if (process.platform !== "win32") {updateCPUtemp();}
        updateCPUspeed();
        updateCPUtasks();
        loadUpdater = setInterval(() => {
            updateCPUload();
        }, 2000);
        if (process.platform !== "win32") {
            tempUpdater = setInterval(() => {
                updateCPUtemp();
            }, 5500);
        }
        speedUpdater = setInterval(() => {
            updateCPUspeed();
        }, 300);
        tasksUpdater = setInterval(() => {
            updateCPUtasks();
        }, 11000);
    });


    function updateCPUload() {
        window.si.currentLoad().then(data => {
            let average = [[], []];

            if (!data.cpus) return; // Prevent memleak in rare case where systeminformation takes extra time to retrieve CPU info (see github issue #216)

            data.cpus.forEach((e, i) => {
                series[i].append(new Date().getTime(), e.load);

                if (i < divide) {
                    average[0].push(e.load);
                } else {
                    average[1].push(e.load);
                }
            });
            average.forEach((stats, i) => {
                average[i] = Math.round(stats.reduce((a, b) => a + b, 0)/stats.length);

                try {
                    document.getElementById(`mod_cpuinfo_usagecounter${i}`).innerText = `Avg. ${average[i]}%`;
                } catch(e) {
                    // Fail silently, DOM element is probably getting refreshed (new theme, etc)
                }
            });
        });
    }
    function updateCPUtemp() {
        window.si.cpuTemperature().then(data => {
            try {
                document.getElementById("mod_cpuinfo_temp").innerText = `${data.max}°C`;
            } catch(e) {
                // See above notice
            }
        });
    }
    function updateCPUspeed() {
        window.si.cpuCurrentspeed().then(data => {
            try {
                document.getElementById("mod_cpuinfo_speed_min").innerText = `${data.min}GHz`;
                document.getElementById("mod_cpuinfo_speed_max").innerText = `${data.max}GHz`;
            } catch(e) {
                // See above notice
            }
        });
    }
    function  updateCPUtasks() {
        window.si.processes().then(data => {
            try {
                document.getElementById("mod_cpuinfo_tasks").innerText = `${data.all}`;
            } catch(e) {
                // See above notice
            }
        });
    }
</script>

<div id="mod_cpuinfo" style="animation-play-state: {active ? "running" : "paused"};">
    {#if cpuName && divide && data}
        <div id="mod_cpuinfo_innercontainer">
            <h1>CPU USAGE<i>{cpuName}</i></h1>
            <div>
                <h1># <em>1</em> - <em>{divide}</em><br>
                <i id="mod_cpuinfo_usagecounter0">Avg. --%</i></h1>
                <canvas id="mod_cpuinfo_canvas_0" height="60"></canvas>
            </div>
            <div>
                <h1># <em>{divide+1}</em> - <em>{data.cores}</em><br>
                <i id="mod_cpuinfo_usagecounter1">Avg. --%</i></h1>
                <canvas id="mod_cpuinfo_canvas_1" height="60"></canvas>
            </div>
            <div>
                <div>
                    <h1>{(process.platform === "win32") ? "CORES" : "TEMP"}<br>
                    <i id="mod_cpuinfo_temp">{(process.platform === "win32") ? data.cores : "--°C"}</i></h1>
                </div>
                <div>
                    <h1>MIN<br>
                    <i id="mod_cpuinfo_speed_min">--GHz</i></h1>
                </div>
                <div>
                    <h1>MAX<br>
                    <i id="mod_cpuinfo_speed_max">--GHz</i></h1>
                </div>
                <div>
                    <h1>TASKS<br>
                    <i id="mod_cpuinfo_tasks">---</i></h1>
                </div>
            </div>
        </div>
    {/if}
</div>