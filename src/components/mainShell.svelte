<script>
    import { onMount } from "svelte";
    import audioManager from "../classes/sfx";
    import { delay, getDisplayName } from "../classes/utils";
    import Terminal from "../classes/terminal";
    import fs, { followTab, readFS, reCalculateDiskUsage } from "../stores/filesystem";

    const { ipcRenderer: ipc } = require("electron");

    var welcomeMessage = "";
    var showShell = false;
    onMount(async () => {
        await delay(10); // 10

        audioManager.expand.play();
        document.getElementById("main_shell").setAttribute("style", "height:0%;margin-bottom:30vh;");
        
        await delay(500); // 510

        document.getElementById("main_shell").setAttribute("style", "margin-bottom: 30vh;");
        document.querySelector("#shell_title > h3.title").setAttribute("style", "");

        await delay(700); // 1210

        document.getElementById("main_shell").setAttribute("style", "opacity: 0;");
        
        await delay(10); // 1220

        document.getElementById("main_shell").setAttribute("style", "");

        await delay(270); // 1490

        getDisplayName().then(user => {
            if (user) {
                welcomeMessage = `Welcome back, <em>${user}</em>`;
            } else {
                welcomeMessage = "Welcome back";
            }
        });

        let greeter = document.getElementById("main_shell_greeting");
        greeter.setAttribute("style", "opacity: 1;");
        
        await delay(1100); // 2590

        greeter.setAttribute("style", "opacity: 0;");

        await delay(500); // 3090

        welcomeMessage = null;

        await delay(100); // 3190

        showShell = true;

        await delay(10); // wait for rerender

        window.term = {
            0: new Terminal({
                role: "client",
                parentId: "terminal0",
                port: window.settings.port || 3000
            })
        };
        window.currentTerm = 0;
        window.term[0].onprocesschange = p => {
            document.getElementById("shell_tab0").innerHTML = `<p>MAIN - ${p}</p>`;
        };

        reCalculateDiskUsage();
        window.term[0].oncwdchange = (cwd => {
            if($fs) {
                $fs.path = cwd;
                followTab();
                readFS(window.term[0].cwd);
                window.term[window.currentTerm].resendCWD();
            }
        });
    });

    function focusShellTab(number) {
        audioManager.folder.play();

        console.log("Focusing");
        if (number !== window.currentTerm && window.term[number]) {
            window.currentTerm = number;

            document.querySelectorAll(`ul#main_shell_tabs > li:not(:nth-child(${number+1}))`).forEach(e => {
                e.setAttribute("class", "");
            });
            document.getElementById("shell_tab"+number).setAttribute("class", "active");

            document.querySelectorAll(`div#main_shell_innercontainer > pre:not(:nth-child(${number+1}))`).forEach(e => {
                e.setAttribute("class", "");
            });
            document.getElementById("terminal"+number).setAttribute("class", "active");

            window.term[number].fit();
            window.term[number].term.focus();
            window.term[number].resendCWD();

            if($fs) followTab();
        } else if (number > 0 && number <= 4 && window.term[number] !== null && typeof window.term[number] !== "object") {
            window.term[number] = null;

            document.getElementById("shell_tab"+number).innerHTML = "<p>LOADING...</p>";
            ipc.send("ttyspawn", "true");
            ipc.once("ttyspawn-reply", (e, r) => {
                if (r.startsWith("ERROR")) {
                    document.getElementById("shell_tab"+number).innerHTML = "<p>ERROR</p>";
                } else if (r.startsWith("SUCCESS")) {
                    let port = Number(r.substr(9));

                    window.term[number] = new Terminal({
                        role: "client",
                        parentId: "terminal"+number,
                        port
                    });

                    window.term[number].onclose = e => {
                        delete window.term[number].onprocesschange;
                        document.getElementById("shell_tab"+number).innerHTML = "<p>EMPTY</p>";
                        document.getElementById("terminal"+number).innerHTML = "";
                        window.term[number].term.dispose();
                        delete window.term[number];
                        // window.useAppShortcut("PREVIOUS_TAB");
                    };

                    window.term[number].onprocesschange = p => {
                        document.getElementById("shell_tab"+number).innerHTML = `<p>#${number+1} - ${p}</p>`;
                    };

                    document.getElementById("shell_tab"+number).innerHTML = `<p>::${port}</p>`;
                    setTimeout(() => {
                        focusShellTab(number);
                    }, 500);
                }
            });
        }
    }
</script>

<section id="main_shell" style="height:0%;width:0%;opacity:0;margin-bottom:30vh;" augmented-ui="bl-clip tr-clip exe">
    {#if welcomeMessage !== null}
        <h1 id="main_shell_greeting">{@html welcomeMessage}</h1>
    {/if}

    {#if showShell}
        <ul id="main_shell_tabs">
            <li id="shell_tab0" on:click={() => focusShellTab(0)} class="active"><p>MAIN SHELL</p></li>
            <li id="shell_tab1" on:click={() => focusShellTab(1)}><p>EMPTY</p></li>
            <li id="shell_tab2" on:click={() => focusShellTab(2)}><p>EMPTY</p></li>
            <li id="shell_tab3" on:click={() => focusShellTab(3)}><p>EMPTY</p></li>
            <li id="shell_tab4" on:click={() => focusShellTab(4)}><p>EMPTY</p></li>
        </ul>
        <div id="main_shell_innercontainer">
            <pre id="terminal0" class="active"></pre>
            <pre id="terminal1"></pre>
            <pre id="terminal2"></pre>
            <pre id="terminal3"></pre>
            <pre id="terminal4"></pre>
        </div>
    {/if}
</section>
<section id="shell_title">
    <h3 class="title" style="opacity:0;"><p>TERMINAL</p><p>MAIN SHELL</p></h3>
</section>