<script>
    import { onMount } from "svelte";
    import audioManager from "../../classes/sfx";
    import { delay } from "../../classes/utils";

    export var offset = 0;

    var active = false;
    onMount(async () => {
        await delay(3090 + 500 * (offset + 1));
        active = true;
        audioManager.panels.play();
    });

    updateInfo();
    var infoUpdater = setInterval(() => {
        updateInfo();
    }, 20000);

    var manufacturer = "NONE";
    var model = "NONE";
    var chassis = "NONE";
    function updateInfo() {
        window.si.system().then(d => {
            window.si.chassis().then(e => {
                manufacturer = trimDataString(d.manufacturer);
                model = trimDataString(d.model, d.manufacturer, e.type);
                chassis = e.type;
            });
        });
    }
    function trimDataString(str, ...filters) {
        return str.trim().split(" ").filter(word => {
            if (typeof filters !== "object") return true;

            return !filters.includes(word);
        }).slice(0, 2).join(" ");
    }
</script>
<div id="mod_hardwareInspector" style="animation-play-state: {active ? "running" : "paused"};">
    <div id="mod_hardwareInspector_inner">
        <div>
            <h2>MANUFACTURER</h2>
            <h1 id="mod_hardwareInspector_manufacturer">{manufacturer}</h1>
        </div>
        <div>
            <h2>MODEL</h2>
            <h1 id="mod_hardwareInspector_model">{model}</h1>
        </div>
        <div>
            <h2>CHASSIS</h2>
            <h1 id="mod_hardwareInspector_chassis">{chassis}</h1>
        </div>
    </div>
</div>