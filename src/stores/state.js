import { writable } from "svelte/store";

const state = writable({
    bootScreen: true,
    bootScreenClasses: ""
});

export default state;