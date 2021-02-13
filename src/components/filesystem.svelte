<script>
    import { onMount } from "svelte";
    import audioManager from "../classes/sfx";
    import { delay, formatBytes } from "../classes/utils";
    import fs, { readDevices, readFS } from "../stores/filesystem";
    import edexIconsGetter from "../data/edexIcons";
    import getIcon from "../data/getIcon";
    import errorModals from "../stores/errorModals";
    import Modal from "../classes/modal";
    import FsIcon from "./fsIcon.svelte";
    import Image from "./modals/image.svelte";
    import Video from "./modals/video.svelte";
    import Audio from "./modals/audio.svelte";
    import Pdf from "./modals/pdf.svelte";
    import Text from "./modals/text.svelte";
    const electron = require("electron");
    const mime = require("mime-types");
    const electronWin = electron.remote.getCurrentWindow();
    const afs = require("fs");

    var openFs = false;
    /** @type {ReturnType<edexIconsGetter>}*/
    var edexIcons;
    // Start offset 1210
    onMount(async () => {
        await delay(280); // 1490
        document.getElementById("filesystem").setAttribute("style", "");
        await delay(1800); // 3290
        openFs = true;
        edexIcons = edexIconsGetter();
        await delay(10); // rerender
        await delay(200); // 3490
        document.getElementById("filesystem").setAttribute("style", "opacity: 1;");
    });

    function click(num, ev) {
        var e = objects[num];
        if(e.type === "up") {
            if (!$fs.detached) {
                window.term[window.currentTerm].writelr("cd ..");
            } else {
                readFS(path.resolve($fs.path, ".."));
            }
        } else if(e.type === "showDisks") {
            readDevices();
        } else if (window.keyboard.container.dataset.isCtrlOn == "true") {
            electron.shell.openPath($fs.contents[num].path);
            electronWin.minimize();
        } else if (window.keyboard.container.dataset.isShiftOn == "true") {
            window.term[window.currentTerm].write("\"" + $fs.contents[num].path + "\"");
        } else {
            if(e.type === "system") return;
            // Handle displayable media
            if (e.displayType === 'video' || e.displayType === 'audio' || e.displayType === 'image') {
                var fileModal;
                switch(e.displayType) {
                    case "image":
                        fileModal = new Modal({
                            type: "custom",
                            title: e.name,
                            component: Image,
                            arguments: {
                                source: "local://" + e.path
                            }
                        });
                        break;
                    case "video":
                        fileModal = new Modal({
                            type: "error",
                            title: "Unsupported action",
                            message: `Opening videos is not yet supported`
                        });
                        // Missing icons
                        // fileModal = new Modal({
                        //     type: "custom",
                        //     title: e.name,
                        //     component: Video,
                        //     arguments: {
                        //         source: "local://" + e.path
                        //     }
                        // });
                        break;
                    case "audio":
                        fileModal = new Modal({
                            type: "error",
                            title: "Unsupported action",
                            message: `Opening audio files is not yet supported`
                        });
                        // missing icons
                        // fileModal = new Modal({
                        //     type: "custom",
                        //     title: e.name,
                        //     component: Audio,
                        //     arguments: {
                        //         source: "local://" + e.path
                        //     }
                        // });
                        break;
                }
                errorModals.update(modals => modals.push(fileModal) && modals);
                return;
            }
            if (e.type === "edex-shortcuts") {
                // window.openShortcutsHelp();
            }

            if (e.type === "edex-theme") {
                // window.themeChanger(e.name.slice(0, -5));
            }
            if (e.type === "edex-kblayout") {
                // window.remakeKeyboard(e.name.slice(0, -5));
            }
            if (e.type === "edex-settings") {
                // window.openSettings();
            }
            if(e.type === "file") {
                let filetype = mime.lookup(e.name.split(".")[e.name.split(".").length - 1]);
                if(filetype === "application/pdf") {
                    let fileModal = new Modal({
                        type: "custom",
                        title: e.name,
                        component: Pdf,
                        arguments: {
                            source: e.path
                        },
                    });
                    errorModals.update(modals => modals.push(fileModal) && modals);
                } else if (mime.charset(filetype) === "UTF-8") {
                    afs.readFile(e.path, 'utf-8', (err, data) => {
                        if (err) {
                            var errorModal = new Modal({
                                type: "info",
                                title: "Failed to load file: " + block.path,
                                html: err
                            });
                            console.log(err);
                            errorModals.update(modals => modals.push(errorModal) && modals);
                            return;
                        };
                        window.keyboard.detach();
                        let fileModal = new Modal({
                            type: "custom",
                            title: e.name,
                            component: Text,
                            arguments: {
                                data
                            },
                            buttons: [
                                {
                                    label:"Save to Disk",
                                    action: (e) => {
                                        console.log(e.target);
                                    }
                                }
                            ]
                        }, () => {
                            window.keyboard.attach();
                            window.term[window.currentTerm].term.focus();
                        });
                        errorModals.update(modals => modals.push(fileModal) && modals);
                    });
                } else {
                    var errorModal = new Modal({
                        type: "error",
                        title: "Unsupported file format",
                        message: "This file cannot be opened directly"
                    });
                    errorModals.update(modals => modals.push(errorModal) && modals);
                }
                // let fileModal = new Modal({
                //     type: "error",
                //     title: "Unsupported action",
                //     message: `Opening files is not yet supported`
                // });
                // errorModals.update(modals => modals.push(fileModal) && modals);
                return;
            }

            if (!$fs.detached) {
                if (e.type === "dir" || e.type.endsWith("Dir")) {
                    window.term[window.currentTerm].writelr("cd \"" + objects[num].name + "\"");
                } else if (e.type === "up") {
                    window.term[window.currentTerm].writelr("cd ..");
                } else if (e.type === "disk" || e.type === "rom" || e.type === "usb") {
                    if (process.platform === "win32") {
                        window.term[window.currentTerm].writelr(e.path.replace(/\\/g, ''));
                    } else {
                        console.log("Moving to path", e.path, e);
                        window.term[window.currentTerm].writelr("cd \"" + e.path.replace(/\\/g, '') + "\"");
                    }
                } else {
                    window.term[window.currentTerm].write("\"" + objects[num].path + "\"");
                }
            } else {
                if (e.type === "dir" || e.type.endsWith("Dir")) {
                    readFS(objects[num].path);
                } else if (e.type === "up") {
                    readFS(path.resolve($fs.path, ".."));
                } else if (e.type === "disk" || e.type === "rom" || e.type === "usb") {
                    readFS(e.path.replace(/\\/g, ''));
                } else {
                    window.term[window.currentTerm].write("\"" + objects[num].path + "\"");
                }
            }
        }
    }

    var objects = [];
    $: if($fs) {
        objects = $fs.diskView ? $fs.devices : $fs.contents;
    }
</script>

<section id="filesystem" style="width: 0px;" class="{window.settings.hideDotfiles ? "hideDotfiles" : ""} {window.settings.fsListView ? "list-view" : ""}">
    {#if openFs}
        {#if $fs.state === 1}
            <h3 class="title"><p>FILESYSTEM</p><p id="fs_disp_title_dir">EXECUTION FAILED</p></h3>
            <h2 id="fs_disp_error">CANNOT ACCESS CURRENT WORKING DIRECTORY</h2>
        {:else}
            <h3 class="title"><p>FILESYSTEM{$fs.detached ? "TRACKING FAILED, RUNNING DETACHED FROM TTY":""}</p><p id="fs_disp_title_dir">{$fs.diskView ? "Showing available block devices" : $fs.path}</p></h3>
            <div id="fs_disp_container">
                {#each objects as e, i}
                    <div class="fs_disp_{e.type}" class:animationWait={$fs.animationPointer < i} class:hidden={e.hidden} on:click={(e) => click(i, e)}>
                        <FsIcon file={e} {edexIcons} />
                        <h3>{e.name}</h3>
                        <h4>{e.displayType}</h4>
                        <h4>{e.size ? formatBytes(e.size) : "--"}</h4>
                        <h4>{e.lastAccessed ? new Date(e.lastAccessed).toLocaleString() : "--"}</h4>
                    </div>
                {/each}
            </div>
            <div id="fs_space_bar">
                <h1>EXIT DISPLAY</h1>
                <h3>{$fs.diskUsage + "%" || "Calculating available space..."}</h3><progress value={$fs.diskUage || 100} max="100"></progress>
            </div>
        {/if}
    {/if}
</section>