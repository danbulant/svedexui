import { writable } from "svelte/store";

const offline = writable(false);
const geoLookup = writable({
    get: () => null
});
const ipinfo = writable(null);
const iface = writable(null);

export {
    offline,
    geoLookup,
    ipinfo,
    iface
};