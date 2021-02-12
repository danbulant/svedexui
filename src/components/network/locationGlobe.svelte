<script>
    import { onMount } from "svelte";
    import audioManager from "../../classes/sfx";
    import { delay } from "../../classes/utils";
    import _geodata from "../../data/vendor/grid.json";
    import "../../data/vendor/encom-globe.js";
    import { geoLookup, ipinfo, offline } from "../../stores/netstat";

    const ENCOM = window.ENCOM;
    export var offset = 0;
    var active = false;

    var globe;
    var conns = [];
    var positionState = "UNKNOWN";
    onMount(async () => {
        await delay(3090 + 500 * (offset + 1));
        active = true;
        audioManager.panels.play();

        let container = document.getElementById("mod_globe_innercontainer");
        let placeholder = document.getElementById("mod_globe_canvas_placeholder");

        // Create Globe
        globe = new ENCOM.Globe(placeholder.offsetWidth, placeholder.offsetHeight, {
            font: window.theme.cssvars.font_main,
            data: [],
            tiles: _geodata.tiles,
            baseColor: window.theme.globe.base || `rgb(${window.theme.r},${window.theme.g},${window.theme.b})`,
            markerColor: window.theme.globe.marker || `rgb(${window.theme.r},${window.theme.g},${window.theme.b})`,
            pinColor: window.theme.globe.pin || `rgb(${window.theme.r},${window.theme.g},${window.theme.b})`,
            satelliteColor: window.theme.globe.satellite || `rgb(${window.theme.r},${window.theme.g},${window.theme.b})`,
            scale: 1.1,
            viewAngle: 0.630,
            dayLength: 1000 * 45,
            introLinesDuration: 2000,
            introLinesColor: window.theme.globe.marker || `rgb(${window.theme.r},${window.theme.g},${window.theme.b})`,
            maxPins: 300,
            maxMarkers: 100
        });
        window.globe = globe;

        // Place Globe
        placeholder.remove();
        container.append(globe.domElement);

        // Init animations
        const _animate = () => {
            if (globe) {
                globe.tick();
            }
            if (_animate) {
                setTimeout(() => {
                    try {
                        requestAnimationFrame(_animate);
                    } catch(e) {
                        // We probably got caught in a theme change. Print it out but everything should keep running fine.
                        console.warn(e);
                    }
                }, 1000 / 15);
            }
        };
        globe.init(window.theme.colors.light_black, () => {
            _animate();
            audioManager.scan.play();
        });

        // resize handler
        const resizeHandler = () => {
            let canvas = document.querySelector("div#mod_globe canvas");
            globe.camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
            globe.camera.updateProjectionMatrix();
            globe.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        };
        window.addEventListener("resize", resizeHandler);

        // Add random satellites
        let constellation = [];
        for(var i = 0; i< 2; i++){
            for(var j = 0; j< 3; j++){
                constellation.push({
                    lat: 50 * i - 30 + 15 * Math.random(),
                    lon: 120 * j - 120 + 30 * i,
                    altitude: Math.random() * (1.7 - 1.3) + 1.3
                });
            }
        }

        globe.addConstellation(constellation);
        await delay(2000);

        updateConns();
        var connsUpdater = setInterval(() => {
            updateConns();
        }, 3000);
    });
    var lastgeo = {};

    // Connections
    function addConn(ip) {
        let data = $geoLookup.get(ip);
        let geo = (data !== null ? data.location : {});
        if (geo.latitude && geo.longitude) {
            const lat = Number(geo.latitude);
            const lon = Number(geo.longitude);
            conns.push({
                ip,
                pin: globe.addPin(lat, lon, "", 1.2),
            });
        }
    };
    function removeConn(ip) {
        let index = conns.findIndex(x => x.ip === ip);
        if(index === -1) return;
        conns[index].pin.remove();
        conns.splice(index, 1);
    };

    function addRandomConnectedMarkers() {
        const randomLat = getRandomInRange(40, 90, 3);
        const randomLong = getRandomInRange(-180, 0, 3);
        globe.addMarker(randomLat, randomLong, '');
        globe.addMarker(randomLat - 20, randomLong + 150, '', true);
    }
    function addTemporaryConnectedMarker(ip) {
        let data = window.mods.netstat.geoLookup.get(ip);
        let geo = (data !== null ? data.location : {});
        if (geo.latitude && geo.longitude) {
            const lat = Number(geo.latitude);
            const lon = Number(geo.longitude);

            window.mods.globe.conns.push({
                ip,
                pin: window.mods.globe.globe.addPin(lat, lon, "", 1.2)
            });
            let mark = window.mods.globe.globe.addMarker(lat, lon, '', true);
            setTimeout(() => {
                mark.remove();
            }, 3000);
        }
    }
    function removeMarkers() {
        globe.markers.forEach(marker => { marker.remove(); });
        globe.markers = [];
    }
    function removePins() {
        globe.pins.forEach(pin => {
            pin.remove();
        });
        globe.pins = [];
    }
    function getRandomInRange(from, to, fixed) {
        return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
    }

    $: {
        if ($offline) {
            positionState = "(OFFLINE)";

            if(globe) {
                removePins();
                removeMarkers();
            }
            conns = [];
            lastgeo = {
                latitude: 0,
                longitude: 0
            };
        } else {
            if($ipinfo) {
                updateConOnlineConnection().catch((e) => {
                    positionState = "UNKNOWN";
                    console.error(e);
                })
            }
        }
    }
    async function updateConOnlineConnection() {
        let newgeo = $ipinfo.geo;
        newgeo.latitude = Math.round(newgeo.latitude*10000)/10000;
        newgeo.longitude = Math.round(newgeo.longitude*10000)/10000;

        if (newgeo.latitude !== lastgeo.latitude || newgeo.longitude !== lastgeo.longitude) {
            positionState = `${newgeo.latitude}, ${newgeo.longitude}`;
            console.log("Setting state", positionState);
            removePins();
            removeMarkers();
            //addRandomConnectedPoints();
            conns = [];

            var _locPin = globe.addPin(newgeo.latitude, newgeo.longitude, "", 1.2);
            var _locMarker = globe.addMarker(newgeo.latitude, newgeo.longitude, "", false, 1.2);
        }

        lastgeo = newgeo;
        document.querySelector("div#mod_globe").setAttribute("class", "");
    }
    function updateConns() {
        if (!globe || $offline) return false;
        window.si.networkConnections().then(conns => {
            let newconns = [];
            conns.forEach(conn => {
                let ip = conn.peeraddress;
                let state = conn.state;
                if (state === "ESTABLISHED" && ip !== "0.0.0.0" && ip !== "127.0.0.1" && ip !== "::") {
                    newconns.push(ip);
                }
            });

            conns.forEach(conn => {
                if (newconns.indexOf(conn.ip) !== -1) {
                    newconns.splice(newconns.indexOf(conn.ip), 1);
                } else {
                    removeConn(conn.ip);
                }
            });

            newconns.forEach(ip => {
                addConn(ip);
            });
        });
    }
</script>

<div id="mod_globe" style="animation-play-state: {active ? "running" : "paused"};" class:offline={$offline}>
    <div id="mod_globe_innercontainer">
        <h1>WORLD VIEW<i>GLOBAL NETWORK MAP</i></h1>
        <h2>ENDPOINT LAT/LON<i class="mod_globe_headerInfo">{positionState}</i></h2>
        <div id="mod_globe_canvas_placeholder"></div>
        <h3>OFFLINE</h3>
    </div>
</div>