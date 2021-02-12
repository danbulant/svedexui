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
            <h1>MANUFACTURER</h1>
            <h2 id="mod_hardwareInspector_manufacturer">{manufacturer}</h2>
        </div>
        <div>
            <h1>MODEL</h1>
            <h2 id="mod_hardwareInspector_model">{model}</h2>
        </div>
        <div>
            <h1>CHASSIS</h1>
            <h2 id="mod_hardwareInspector_chassis">{chassis}</h2>
        </div>
    </div>
</div>