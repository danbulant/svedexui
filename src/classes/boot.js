import bootLog from "../stores/bootLog";
import { delay, purifyCSS } from "./utils";
import audioManager from "./sfx";
import textSource from "../data/boot_log.txt";
import state from "../stores/state";
import errorModals from "../stores/errorModals";
import Modal from "./modal";

function log(text) {
    bootLog.update(src => src + "\n" + text);
}
window.onerror = (msg, path, line, col, error) => {
    log(`${error} :  ${msg}<br/>==> at ${path}  ${line}:${col}`);
};
// Disable eval()
window.eval = global.eval = function () {
    throw new Error("eval() is disabled for security reasons.");
};

const path = require("path");
const fs = require("fs");
const electron = require("electron");
const ipc = electron.ipcRenderer;

const settingsDir = electron.remote.app.getPath("userData");
const themesDir = path.join(settingsDir, "themes");
const keyboardsDir = path.join(settingsDir, "keyboards");
const fontsDir = path.join(settingsDir, "fonts");
const settingsFile = path.join(settingsDir, "settings.json");
const shortcutsFile = path.join(settingsDir, "shortcuts.json");
const lastWindowStateFile = path.join(settingsDir, "lastWindowState.json");

window.settings = require(settingsFile);
window.shortcuts = require(shortcutsFile);
window.lastWindowState = require(lastWindowStateFile);

let i = 0;
let text = textSource.toString().split('\n');

// Retrieve theme override (hotswitch)
ipc.once("getThemeOverride", (e, theme) => {
    if (theme !== null) {
        window.settings.theme = theme;
        window.settings.nointroOverride = true;
        _loadTheme(require(path.join(themesDir, window.settings.theme+".json")));
    } else {
        _loadTheme(require(path.join(themesDir, window.settings.theme+".json")));
    }
});
ipc.send("getThemeOverride");
// Same for keyboard override/hotswitch
ipc.once("getKbOverride", (e, layout) => {
    if (layout !== null) {
        window.settings.keyboard = layout;
        window.settings.nointroOverride = true;
    }
});
ipc.send("getKbOverride");

// Load UI theme
window._loadTheme = theme => {

    if (document.querySelector("style.theming")) {
        document.querySelector("style.theming").remove();
    }

    // Load fonts
    let mainFont = new FontFace(theme.cssvars.font_main, `url("local://${path.join(fontsDir, theme.cssvars.font_main.toLowerCase().replace(/ /g, '_')+'.woff2').replace(/\\/g, '/')}")`);
    let lightFont = new FontFace(theme.cssvars.font_main_light, `url("local://${path.join(fontsDir, theme.cssvars.font_main_light.toLowerCase().replace(/ /g, '_')+'.woff2').replace(/\\/g, '/')}")`);
    let termFont = new FontFace(theme.terminal.fontFamily, `url("local://${path.join(fontsDir, theme.terminal.fontFamily.toLowerCase().replace(/ /g, '_')+'.woff2').replace(/\\/g, '/')}")`);

    document.fonts.add(mainFont);
    document.fonts.load("12px "+theme.cssvars.font_main);
    document.fonts.add(lightFont);
    document.fonts.load("12px "+theme.cssvars.font_main_light);
    document.fonts.add(termFont);
    document.fonts.load("12px "+theme.terminal.fontFamily);

    document.querySelector("head").innerHTML += `<style class="theming">
    :root {
        --font_main: "${purifyCSS(theme.cssvars.font_main)}";
        --font_main_light: "${purifyCSS(theme.cssvars.font_main_light)}";
        --font_mono: "${purifyCSS(theme.terminal.fontFamily)}";
        --color_r: ${purifyCSS(theme.colors.r)};
        --color_g: ${purifyCSS(theme.colors.g)};
        --color_b: ${purifyCSS(theme.colors.b)};
        --color_black: ${purifyCSS(theme.colors.black)};
        --color_light_black: ${purifyCSS(theme.colors.light_black)};
        --color_grey: ${purifyCSS(theme.colors.grey)};
        /* Used for error and warning modals */
        --color_red: ${purifyCSS(theme.colors.red) || "red"};
        --color_yellow: ${purifyCSS(theme.colors.yellow) || "yellow"};
    }
    body {
        font-family: var(--font_main), sans-serif;
        cursor: ${(window.settings.nocursorOverride || window.settings.nocursor) ? "none" : "default"} !important;
    }
    * {
   	   ${(window.settings.nocursorOverride || window.settings.nocursor) ? "cursor: none !important;" : ""}
	}
    ${purifyCSS(theme.injectCSS || "")}
    </style>`;

    window.theme = theme;
    window.theme.r = theme.colors.r;
    window.theme.g = theme.colors.g;
    window.theme.b = theme.colors.b;
};

// Startup boot log
function displayLine() {
    function isArchUser() {
        return require("os").platform() === "linux"
                && fs.existsSync("/etc/os-release")
                && fs.readFileSync("/etc/os-release").toString().includes("arch");
    }

    if (typeof text[i] === "undefined") {
        setTimeout(displayTitleScreen, 300);
        return;
    }

    if (text[i] === "Boot Complete") {
        audioManager.granted.play();
    } else {
        audioManager.stdout.play();
    }
    log(text[i]+"<br/>");
    i++;

    switch(true) {
        case i === 2:
            log(`eDEX-UI Kernel version ${electron.remote.app.getVersion()} boot at ${Date().toString()}; root:xnu-1699.22.73~1/RELEASE_X86_64`);
        case i === 4:
            setTimeout(displayLine, 500);
            break;
        case i > 4 && i < 25:
            setTimeout(displayLine, 30);
            break;
        case i === 25:
            setTimeout(displayLine, 400);
            break;
        case i === 42:
            setTimeout(displayLine, 300);
            break;
        case i > 42 && i < 82:
            setTimeout(displayLine, 25);
            break;
        case i === 83:
            if (isArchUser())
                log("btw i use arch<br/>");
            setTimeout(displayLine, 25);
            break;
        case i >= text.length-2 && i < text.length:
            setTimeout(displayLine, 300);
            break;
        default:
            setTimeout(displayLine, Math.pow(1 - (i/1000), 3)*25);
    }
}

displayLine();

// Show "logo" and background grid
async function displayTitleScreen() {
    bootLog.set("");
    audioManager.theme.play();

    await delay(400);

    document.body.setAttribute("class", "");
    state.update(state => ({ ...state, bootScreenClasses: "center"}));
    bootLog.set("<h1>eDEX-UI</h1>");

    await delay(10); // rerender wait
    let title = document.querySelector("section > h1");

    await delay(200);

    document.body.setAttribute("class", "solidBackground");

    await delay(100);

    title.setAttribute("style", `background-color: rgb(${window.theme.r}, ${window.theme.g}, ${window.theme.b});border-bottom: 5px solid rgb(${window.theme.r}, ${window.theme.g}, ${window.theme.b});`);

    await delay(300);

    title.setAttribute("style", `border: 5px solid rgb(${window.theme.r}, ${window.theme.g}, ${window.theme.b});`);

    await delay(100);

    title.setAttribute("style", "");
    title.setAttribute("class", "glitch");

    await delay(500);

    document.body.setAttribute("class", "");
    title.setAttribute("class", "");
    title.setAttribute("style", `border: 5px solid rgb(${window.theme.r}, ${window.theme.g}, ${window.theme.b});`);

    await delay(1000);
    if (window.term) {
        bootScreen.remove();
        return true;
    }
    initGraphicalErrorHandling();

    initSystemInformationProxy();
    waitForFonts().then(() => {
        state.update(state => ({ ...state, bootScreen: false }))
    });
}

function initGraphicalErrorHandling() {
    window.onerror = (msg, path, line, col, error) => {
        let errorModal = new Modal({
            type: "error",
            title: error,
            message: `${msg}<br/>        at ${path}  ${line}:${col}`
        });
        errorModals.update(modals => modals.push(errorModal) && modals);

        ipc.send("log", "error", `${error}: ${msg}`);
        ipc.send("log", "debug", `at ${path} ${line}:${col}`);
    };
}


function waitForFonts() {
    return new Promise(resolve => {
        if (document.readyState !== "complete" || document.fonts.status !== "loaded") {
            document.addEventListener("readystatechange", () => {
                if (document.readyState === "complete") {
                    if (document.fonts.status === "loaded") {
                        resolve();
                    } else {
                        document.fonts.onloadingdone = () => {
                            if (document.fonts.status === "loaded") resolve();
                        };
                    }
                }
            });
        } else {
            resolve();
        }
    });
}

// A proxy function used to add multithreading to systeminformation calls - see backend process manager @ _multithread.js
function initSystemInformationProxy() {
    const { nanoid } = require("nanoid/non-secure");

    window.si = new Proxy({}, {
        apply: () => {throw new Error("Cannot use sysinfo proxy directly as a function")},
        set: () => {throw new Error("Cannot set a property on the sysinfo proxy")},
        get: (target, prop, receiver) => {
            return function(...args) {
                let callback = (typeof args[args.length - 1] === "function") ? true : false;

                return new Promise((resolve, reject) => {
                    let id = nanoid();
                    ipc.once("systeminformation-reply-"+id, (e, res) => {
                        if (callback) {
                            args[args.length - 1](res);
                        }
                        resolve(res);
                    });
                    ipc.send("systeminformation-call", prop, id, ...args);
                });
            };
        }
    });
}