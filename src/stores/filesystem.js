import { writable } from "svelte/store";
import audioManager from "../classes/sfx";
import { escapeHtml } from "../classes/utils";

const path = require("path");
const fs = require("fs");
const electron = require("electron");

const settingsDir = electron.remote.app.getPath("userData");
const themesDir = path.join(settingsDir, "themes");
const keyboardsDir = path.join(settingsDir, "keyboards");

var valueCache = {
    /**
     * 0 = normal
     * 1 = failed
     */
    state: 0,
    contents: [],
    detached: false,
    path: "/",
    diskUsage: null,
    displayMount: null,
    diskView: false,
    devices: null,
    animationPointer: Infinity
};

const filesystem = writable(valueCache);

var asyncFSwrapper = new Proxy(fs, {
    get: function(fs, prop) {
        if (prop in fs) {
            return function(...args) {
                return new Promise((resolve, reject) => {
                    fs[prop](...args, (err, d) => {
                        if (typeof err !== "undefined" && err !== null) reject(err);
                        if (typeof d !== "undefined") resolve(d);
                        if (typeof d === "undefined" && typeof err === "undefined") resolve();
                    });
                });
            }
        }
    },
    set: function() {
        return false;
    }
});

var runNextTick = false;

var timer = setInterval(() => {
    if (runNextTick === true) {
        runNextTick = false;
        readFS(valueCache.path);
    }
}, 1000);

function followTab() {
    // Don't follow tabs when running in detached mode, see #432
    if (valueCache.detached) return false;

    let num = window.currentTerm;

    if(typeof num !== "number" || !window.term) return;
    window.term[num].oncwdchange = cwd => {
        // See #501
        if (valueCache.detached) return false;

        if (cwd && cwd !== valueCache.path && window.currentTerm === num) {
            valueCache.path = cwd;
            if (watcher) {
                watcher.close();
            }
            if (cwd.startsWith("FALLBACK |-- ")) {
                readFS(cwd.slice(13));
                valueCache.detached = true;
                filesystem.set(valueCache);
            } else {
                readFS(cwd);
                watchFS(cwd);
            }
        }
    };
}

var reading;
async function readFS(dir) {
    if (valueCache.state === 1 || reading) return false;
    reading = true;

    document.getElementById("fs_disp_title_dir").innerText = valueCache.path;

    if (process.platform === "win32" && dir.endsWith(":")) dir = dir+"\\";
    let tcwd = dir;
    let content = await asyncFSwrapper.readdir(tcwd).catch(err => {
        console.warn(err);
        if (valueCache.detached === true && valueCache.path) { // #262
            valueCache.state = 1;
            filesystem.set(valueCache);
            setTimeout(() => {
                readFS(valueCache.path);
            }, 1000);
        } else {
            valueCache.state = 1;
            filesystem.set(valueCache);
        }
    });

    reCalculateDiskUsage(tcwd);

    valueCache.contents = [];

    await new Promise((resolve, reject) => {
        if (content.length === 0) resolve();

        content.forEach(async (file, i) => {
            let fstat = await asyncFSwrapper.lstat(path.join(tcwd, file)).catch(e => {
                if (!e.message.includes("EPERM") && !e.message.includes("EBUSY")) {
                    reject();
                }
            });

            let e = {
                name: escapeHtml(file),
                path: path.resolve(tcwd, file),
                type: "other",
                category: "other",
                hidden: false
            };

            if (typeof fstat !== "undefined") {
                e.lastAccessed = fstat.mtime.getTime();

                if (fstat.isDirectory()) {
                    e.category = "dir";
                    e.type = "dir";
                }
                if (e.category === "dir" && tcwd === settingsDir && file === "themes") e.type="edex-themesDir";
                if (e.category === "dir" && tcwd === settingsDir && file === "keyboards") e.type = "edex-kblayoutsDir";

                if (fstat.isSymbolicLink()) {
                    e.category = "symlink";
                    e.type = "symlink";
                }

                if (fstat.isFile()) {
                    e.category = "file";
                    e.type = "file";
                    e.size = fstat.size;
                }
            } else {
                e.type = "system";
                e.hidden = true;
            }

            if (e.category === "file" && tcwd === themesDir && file.endsWith(".json")) e.type = "edex-theme";
            if (e.category === "file" && tcwd === keyboardsDir && file.endsWith(".json")) e.type = "edex-kblayout";
            if (e.category === "file" && tcwd === settingsDir && file === "settings.json") e.type = "edex-settings";
            if (e.category === "file" && tcwd === settingsDir && file === "shortcuts.json") e.type = "edex-shortcuts";

            if (file.startsWith(".")) e.hidden = true;

            valueCache.contents.push(e);
            if (i === content.length-1) resolve();
        });
    }).catch((e) => {
        console.error(e);
        valueCache.state = 1;
        filesystem.set(valueCache);
    });

    if (valueCache.state === 1) return false;

    let ordering = {
        dir: 0,
        symlink: 1,
        file: 2,
        other: 3
    };

    valueCache.contents.sort((a, b) => {
        return (ordering[a.category] - ordering[b.category] || a.name.localeCompare(b.name));
    });

    valueCache.contents.splice(0, 0, {
        name: "Show disks",
        type: "showDisks"
    });

    if (tcwd !== "/" && /^[A-Z]:\\$/i.test(tcwd) === false) {
        valueCache.contents.splice(1, 0, {
            name: "Go up",
            type: "up"
        });
    }

    valueCache.path = tcwd;
    valueCache.diskView = false;
    filesystem.set(valueCache); // render
    animateRender();
    reading = false;
};

async function readDevices()  {
    if (valueCache.state === 1) return false;

    let blocks = await window.si.blockDevices();
    let devices = [];
    blocks.forEach(block => {
        if (fs.existsSync(block.mount)) {
            let type = (block.type === "rom") ? "rom" : "disk";
            if (block.removable && block.type !== "rom") {
                type = "usb";
            }

            devices.push({
                name: (block.label !== "") ? `${block.label} (${block.name})` : `${block.mount} (${block.name})`,
                type,
                path: block.mount
            });
        }
    });

    valueCache.devices = devices;
    valueCache.diskView = true;
    filesystem.set(valueCache);
    animateRender();
};

async function animateRender() {
    valueCache.animationPointer = 0;
    filesystem.set(valueCache);
    const showNext = () => {
        if(valueCache.animationPointer > (valueCache.diskView ? valueCache.devices.length : valueCache.contents.length)) {
            valueCache.animationPointer = Infinity;
            filesystem.set(valueCache);
        } else {
            valueCache.animationPointer++;
            if (window.settings.hideDotfiles !== true || e.className.indexOf("hidden") === -1) {
                audioManager.folder.play();
                filesystem.set(valueCache);
                setTimeout(() => showNext());
            } else {
                showNext();
            }
        }
    }
    showNext();
}

async function reCalculateDiskUsage() {
    var fsBlock = null;

    try {
        var d = await window.si.fsSize();
    } catch(e) {
        valueCache.diskUsage = false;
        filesystem.set(valueCache);
        return null;
    }
    d.forEach(fsBlock => {
        if (valueCache.path.startsWith(fsBlock.mount)) {
            valueCache.fsBlock = fsBlock;
        }
    });
    fsBlock = valueCache.fsBlock;
    if (fsBlock === null) return;

    let splitter = (process.platform === "win32") ? "\\" : "/";
    let displayMount = (fsBlock.mount.length < 18) ? fsBlock.mount : "..."+splitter+fsBlock.mount.split(splitter).pop();

    valueCache.displayMount = displayMount;

    // See #226
    if (!isNaN(fsBlock.use)) {
        valueCache.diskUsage = Math.round(fsBlock.use);
        filesystem.set(valueCache);
    } else if (!isNaN((fsBlock.size / fsBlock.used) * 100)) {
        valueCache.diskUsage = Math.round((fsBlock.size / fsBlock.used) * 100);
        filesystem.set(valueCache);
    } else {
        valueCache.diskUsage = false;
        filesystem.set(valueCache);
    }
}

var watcher;
function watchFS(dir) {
    if (watcher) {
        watcher.close();
    }
    watcher = fs.watch(dir, (eventType, filename) => {
        if (eventType != "change") { // #758 - Don't refresh file view if only file contents have changed.
            runNextTick = true;
        }
    });
};

export {
    followTab,
    readDevices,
    reCalculateDiskUsage,
    readFS
}

export default filesystem;