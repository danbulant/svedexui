
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


    updateList();
    var listUpdater = setInterval(() => {
        updateList();
    }, 2000);

    var list = [];
    function updateList() {
        window.si.processes().then(data => {
            if (window.settings.excludeThreadsFromToplist === true) {
                data.list = data.list.sort((a, b) => {
                    return (a.pid-b.pid);
                }).filter((e, index, a) => {
                    let i = a.findIndex(x => x.name === e.name);
                    if (i !== -1 && i !== index) {
                        a[i].pcpu = a[i].pcpu+e.pcpu;
                        a[i].pmem = a[i].pmem+e.pmem;
                        return false;
                    }
                    return true;
                });
            }

            list = data.list.sort((a, b) => {
                return ((b.pcpu-a.pcpu)*100 + b.pmem-a.pmem);
            }).splice(0, 5);
        });
    }
</script>

<div id="mod_toplist" style="animation-play-state: {active ? "running" : "paused"};">
    <h1>TOP PROCESSES<i>PID | NAME | CPU | MEM</i></h1><br>
    <table id="mod_toplist_table">
        {#each list as proc}
            <tr>
                <td>{proc.pid}</td>
                <td><strong>{proc.name}</strong></td>
                <td>{Math.round(proc.pcpu*10)/10}%</td>
                <td>{Math.round(proc.pmem*10)/10}%</td>
            </tr>
        {/each}
    </table>
</div>