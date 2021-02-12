<script>
    import { onMount } from "svelte";
    import audioManager from "../../classes/sfx";
    import { delay } from "../../classes/utils";

    export var offset = 0;
    let os;
    switch (require("os").platform()) {
        case "darwin":
            os = "macOS";
            break;
        case "win32":
            os = "win";
            break;
        default:
            os = require("os").platform();
    }

    var active = false;
    onMount(async () => {
        await delay(3090 + 500 * (offset + 1));
        active = true;
        audioManager.panels.play();
    });

    var datetime;
    var year;
    function updateDate() {
        let time = new Date();

        year = time.getFullYear();

        let month = time.getMonth();
        switch(month) {
            case 0:
                month = "JAN";
                break;
            case 1:
                month = "FEB";
                break;
            case 2:
                month = "MAR";
                break;
            case 3:
                month = "APR";
                break;
            case 4:
                month = "MAY";
                break;
            case 5:
                month = "JUN";
                break;
            case 6:
                month = "JUL";
                break;
            case 7:
                month = "AUG";
                break;
            case 8:
                month = "SEP";
                break;
            case 9:
                month = "OCT";
                break;
            case 10:
                month = "NOV";
                break;
            case 11:
                month = "DEC";
                break;
        }
        datetime = month+" "+time.getDate();

        let timeToNewDay = ((23 - time.getHours()) * 3600000) + ((59 - time.getMinutes()) * 60000);
        setTimeout(() => {
            updateDate();
        }, timeToNewDay);
    }
    updateDate();

    var uptimeTime;
    function updateUptime() {
        let uptime = {
            raw: Math.floor(require("os").uptime()),
            days: 0,
            hours: 0,
            minutes: 0
        };

        uptime.days = Math.floor(uptime.raw/86400);
        uptime.raw -= uptime.days*86400;
        uptime.hours = Math.floor(uptime.raw/3600);
        uptime.raw -= uptime.hours*3600;
        uptime.minutes = Math.floor(uptime.raw/60);

        if (uptime.hours.toString().length !== 2) uptime.hours = "0"+uptime.hours;
        if (uptime.minutes.toString().length !== 2) uptime.minutes = "0"+uptime.minutes;

        uptimeTime = uptime.days+":"+uptime.hours+":"+uptime.minutes;
    }
    var battery = "ON";
    function updateBattery() {
        window.si.battery().then(bat => {
            if (bat.hasbattery) {
                if (bat.ischarging) {
                    battery = "CHARGE";
                } else if (bat.acconnected /*|| bat.timeremaining === -1*/) {//fixes #833
                    battery = "WIRED";
                } else {
                    battery = bat.percent+"%";
                }
            } else {
                battery = "ON";
            }
        });
    }
    updateUptime();
    var uptimeUpdater = setInterval(() => {
        updateUptime();
    }, 60000);
    updateBattery();
    var batteryUpdater = setInterval(() => {
        updateBattery();
    }, 3000);
</script>

<div id="mod_sysinfo" style="animation-play-state: {active ? "running" : "paused"};">
    <div>
        <h1>{year}</h1>
        <h2>{datetime}</h2>
    </div>
    <div>
        <h1>UPTIME</h1>
        <h2>{uptimeTime}</h2>
    </div>
    <div>
        <h1>TYPE</h1>
        <h2>{os}</h2>
    </div>
    <div>
        <h1>POWER</h1>
        <h2>{battery}</h2>
    </div>
</div>