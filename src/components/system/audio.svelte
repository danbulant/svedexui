<script>
    import { onMount } from "svelte";
    import audioManager from "../../classes/sfx";
    import { delay } from "../../classes/utils";
    import { getPlayerAndProps, getProxy, listAll, getMetadata } from "../../classes/audioplayer";

    export var offset = 0;
    var active = false;

    /** @type {import("dbus-next").ProxyObject}*/
    var proxy;
    /** @type {import("dbus-next").ClientInterface} */
    var player;
    /** @type {import("dbus-next").ClientInterface} */
    var properties;
    /** @type {string[]}*/
    var players;

    var nowPlaying = {
        title: null,
        author: null,
        progress: null,
        volume: null
    }
    function updateProperties(metadata) {
        let artistVariant = metadata.value['xesam:artist'];
        let titleVariant = metadata.value['xesam:title'];
        nowPlaying.author = artistVariant ? artistVariant.value : 'unknown';
        nowPlaying.title = titleVariant ? titleVariant.value : 'unknown';
    }
    onMount(async () => {
        await delay(3090 + 500 * (offset + 1));
        active = true;
        audioManager.panels.play();
        players = await listAll();
        proxy = await getProxy(players[0]);
        var t = getPlayerAndProps(proxy, players[0]);
        player = t.player;
        properties = t.props;
        properties.on('PropertiesChanged', (iface, changed, invalidated) => {
            if (changed.hasOwnProperty('Metadata')) {
                updateProperties(changed['Metadata']);
            }
        });
        updateProperties(await getMetadata(properties));
    });
</script>


<div id="mod_player" style="animation-play-state: {active ? "running" : "paused"};">
    {nowPlaying.author} - {nowPlaying.title}
</div>