<script>
    import { onMount } from "svelte";
    import audioManager from "../../classes/sfx";
    import { delay } from "../../classes/utils";
    import { geoLookup, iface, ipinfo, offline } from "../../stores/netstat";

    export var offset = 0;
    var active = false;

    onMount(async () => {
        await delay(3090 + 500 * (offset + 1));
        active = true;
        audioManager.panels.play();
    });

    var lastconn = {finished: true}; // Prevent geoip lookup attempt until maxminddb is loaded
    var failedAttempts = {};
    var runsBeforeGeoIPUpdate = 0;

    // Init updaters
    updateInfo();
    var infoUpdater = setInterval(() => {
        updateInfo();
    }, 5000);

    // Init GeoIP integrated backend
    let geolite2 = require("geolite2-redist");
    let maxmind = require("maxmind");
    geolite2.downloadDbs(require("path").join(require("electron").remote.app.getPath("userData"), "geoIPcache")).then(() => {
        geolite2.open('GeoLite2-City', path => {
            return maxmind.open(path);
        }).catch(e => {throw e}).then(lookup => {
            $geoLookup = lookup;
            lastconn.finished = true;
        });
    });

    var state = "UNKNOWN";
    var ip = null;
    var pingms = "--ms";
    var iname = "";
    var internalIPv4;

    function updateInfo() {
        window.si.networkInterfaces().then(async data => {
            $offline = false;

            let net = data[0];
            let netID = 0;

            if (typeof window.settings.iface === "string") {
                while (net.iface !== window.settings.iface) {
                    netID++;
                    if (data[netID]) {
                        net = data[netID];
                    } else {
                        // No detected interface has the custom iface name, fallback to automatic detection on next loop
                        window.settings.iface = false;
                        return false;
                    }
                }
            } else {
                // Find the first external, IPv4 connected networkInterface that has a MAC address set

                while (net.operstate !== "up" || net.internal === true || net.ip4 === "" || net.mac === "") {
                    netID++;
                    if (data[netID]) {
                        net = data[netID];
                    } else {
                        // No external connection!
                        $iface = null;
                        iname = "Interface: (offline)";

                        $offline = true;
                        state = "OFFLINE";
                        ip = null;
                        pingms = "--ms";
                        break;
                    }
                }
            }

            if (net.ip4 !== internalIPv4) runsBeforeGeoIPUpdate = 0;

            $iface = net.iface;
            internalIPv4 = net.ip4;
            iname = "Interface: "+net.iface;

            if (net.ip4 === "127.0.0.1") {
                $offline = true;
            } else {
                if (runsBeforeGeoIPUpdate === 0 && lastconn.finished && (!ip || $offline || !$ipinfo)) {
                    lastconn.finished = false;
                    fetch("https://myexternalip.com/json").then(res => res.json()).then(data => {
                        if($geoLookup.metadata) {
                            $ipinfo = {
                                ip: data.ip,
                                geo: $geoLookup.get(data.ip).location
                            };
                        }

                        ip = data.ip;
                        $offline = false;

                        runsBeforeGeoIPUpdate = 10;
                        lastconn.finished = true;
                    }).catch(e => {
                        lastconn.finished = true;
                        failedAttempts[e] = (failedAttempts[e] || 0) + 1;
                        if (failedAttempts[e] > 2) return false;
                        console.warn(e);
                        console.info(rawData.toString());
                        let electron = require("electron");
                        electron.ipcRenderer.send("log", "note", "NetStat: Error parsing data from myexternalip.com");
                        electron.ipcRenderer.send("log", "debug", `Error: ${e}`);
                    });
                } else if (runsBeforeGeoIPUpdate !== 0) {
                    runsBeforeGeoIPUpdate = runsBeforeGeoIPUpdate - 1;
                }

                let p = await ping(window.settings.pingAddr || "1.1.1.1", 80, net.ip4).catch((e) => { $offline = true; console.error(e) });

                if ($offline) {
                    state = "OFFLINE";
                    ip = null;
                    pingms = "--ms";
                } else {
                    state = "ONLINE";
                    pingms = Math.round(p)+"ms";
                }
            }
        });
    }
    function ping(target, port, local) {
        return new Promise((resolve, reject) => {
            let s = new require("net").Socket();
            let start = process.hrtime();

            s.connect({
                port,
                host: target,
                localAddress: local,
                family: 4
            }, () => {
                let time_arr = process.hrtime(start);
                let time = (time_arr[0] * 1e9 + time_arr[1]) / 1e6;
                resolve(time);
                s.destroy();
            });
            s.on('error', e => {
                s.destroy();
                reject(e);
            });
            s.setTimeout(3000, function() {
                s.destroy();
                reject(new Error("Socket timeout"));
            });
        });
    }
</script>

<div id="mod_netstat" style="animation-play-state: {active ? "running" : "paused"};">
    <div id="mod_netstat_inner">
        <h1>NETWORK STATUS<i id="mod_netstat_iname">{iname}</i></h1>
        <div id="mod_netstat_innercontainer">
            <div>
                <h1>STATE</h1>
                <h2>{state}</h2>
            </div>
            <div>
                <h1>IPv4</h1>
                <h2>{ip || $ipinfo && $ipinfo.ip || "--.--.--.--"}</h2>
            </div>
            <div>
                <h1>PING</h1>
                <h2>{pingms}</h2>
            </div>
        </div>
    </div>
</div>