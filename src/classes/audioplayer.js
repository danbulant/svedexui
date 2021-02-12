const dbus = require('dbus-next');

const MPRIS_IFACE = 'org.mpris.MediaPlayer2.Player';
const MPRIS_PATH = '/org/mpris/MediaPlayer2';
const PROPERTIES_IFACE = 'org.freedesktop.DBus.Properties';

/**
 * @returns {string[]}
 */
async function listAll() {
    let result = [];
    let bus = dbus.sessionBus();
    let obj = await bus.getProxyObject('org.freedesktop.DBus', '/org/freedesktop/DBus');
    let iface = obj.getInterface('org.freedesktop.DBus');
    let names = await iface.ListNames();
    for (let n of names) {
        if (n.startsWith('org.mpris.MediaPlayer2.')) {
            result.push(n);
        }
    }
    return result;
}

let lastNowPlaying = '';

function printNowPlaying(metadata) {
    let artistVariant = metadata.value['xesam:artist'];
    let titleVariant = metadata.value['xesam:title'];
    let artist = artistVariant ? artistVariant.value : 'unknown';
    let title = titleVariant ? titleVariant.value : 'unknown';
    let nowPlaying = `${artist} - ${title}`;

    if (lastNowPlaying !== nowPlaying) {
        console.log(nowPlaying);
        lastNowPlaying = nowPlaying;
    }
}

async function nowPlaying(obj) {
    return new Promise(resolve => {
        let props = obj.getInterface(PROPERTIES_IFACE);
        props.on('PropertiesChanged', (iface, changed, invalidated) => {
            if (changed.hasOwnProperty('Metadata')) {
                printNowPlaying(changed['Metadata']);
            }
        });
    });
}

/**
 * 
 * @param {string} playerName 
 */
async function getProxy(playerName) {
    let bus = dbus.sessionBus();
    return await bus.getProxyObject(playerName, MPRIS_PATH);
}

/**
 * 
 * @param {dbus.ProxyObject} proxy 
 */
function getPlayerAndProps(proxy, playerName) {
    return {
        player: proxy.getInterface(playerName),
        props: proxy.getInterface(PROPERTIES_IFACE)
    }
}

/**
 * 
 * @param {dbus.ClientInterface} props 
 */
async function getMetadata(props) {
    return await props.Get(MPRIS_IFACE, 'Metadata');
}

export {
    listAll,
    nowPlaying,
    getProxy,
    getPlayerAndProps,
    getMetadata
}