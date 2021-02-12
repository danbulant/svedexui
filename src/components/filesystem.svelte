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
            electron.shell.openItem($fs.contents[num].path);
            electronWin.minimize();
        } else if (window.keyboard.container.dataset.isShiftOn == "true") {
            window.term[window.currentTerm].write("\"" + $fs.contents[num].path + "\"");
        } else {
            if(e.type === "system") return;
            // Handle displayable media
            if (e.type === 'video' || e.type === 'audio' || e.type === 'image') {
                this.cwd[blockIndex].type = e.type;
                //window.fsDisp.openMedia(num);
                let errorModal = new Modal({
                    type: "error",
                    title: "Unsupported action",
                    message: `Opening media is not yet supported`
                });
                errorModals.update(modals => modals.push(errorModal) && modals);
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
                // window.fsDisp.openFile(num);
                let errorModal = new Modal({
                    type: "error",
                    title: "Unsupported action",
                    message: `Opening files is not yet supported`
                });
                errorModals.update(modals => modals.push(errorModal) && modals);
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