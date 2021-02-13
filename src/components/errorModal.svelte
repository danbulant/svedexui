<script>
    import { onMount } from "svelte";

    export var modal;

    onMount(() => {
        // Allow dragging the modal around
        let draggedModal = document.getElementById(`modal_${modal.id}`);
        let dragTarget = document.querySelector(`div#modal_${modal.id} > h1:first-child`);

        draggedModal.zindex = draggedModal.getAttribute("style");

        // Wait for correct rendering of medias and such before calculating rect size
        setTimeout(() => {
            let rect = draggedModal.getBoundingClientRect();
            draggedModal.posX = rect.left;
            draggedModal.posY = rect.top;
        }, 500);

        // Mouse
        function modalMousedownHandler(e) {
            draggedModal.lastMouseX = e.clientX;
            draggedModal.lastMouseY = e.clientY;

            draggedModal.setAttribute("style", `${draggedModal.zindex}background: rgba(var(--color_r), var(--color_g), var(--color_b), 0.5);left: ${draggedModal.posX}px;top: ${draggedModal.posY}px;`);

            window.addEventListener("mousemove", modalMousemoveHandler);
            window.addEventListener("mouseup", modalMouseupHandler);
        }
        function modalMousemoveHandler(e) {
            draggedModal.posX = draggedModal.posX + (e.clientX - draggedModal.lastMouseX);
            draggedModal.posY = draggedModal.posY + (e.clientY - draggedModal.lastMouseY);
            draggedModal.lastMouseX = e.clientX;
            draggedModal.lastMouseY = e.clientY;

            draggedModal.setAttribute("style", `${draggedModal.zindex}background: rgba(var(--color_r), var(--color_g), var(--color_b), 0.5);left: ${draggedModal.posX}px;top: ${draggedModal.posY}px;`);
        }
        function modalMouseupHandler(e) {
            window.removeEventListener("mousemove", modalMousemoveHandler);
            draggedModal.setAttribute("style", `${draggedModal.zindex}left: ${draggedModal.posX}px;top: ${draggedModal.posY}px;`);

            window.removeEventListener("mouseup", modalMouseupHandler);
        }
        dragTarget.addEventListener("mousedown", modalMousedownHandler);

        // Touch
        function modalTouchstartHandler(e) {
            draggedModal.lastMouseX = e.changedTouches[0].clientX;
            draggedModal.lastMouseY = e.changedTouches[0].clientY;

            draggedModal.setAttribute("style", `${draggedModal.zindex}background: rgba(var(--color_r), var(--color_g), var(--color_b), 0.5);left: ${draggedModal.posX}px;top: ${draggedModal.posY}px;`);

            window.addEventListener("touchmove", modalTouchmoveHandler);
            window.addEventListener("touchend", modalTouchendHandler);
        }
        function modalTouchmoveHandler(e) {
            draggedModal.posX = draggedModal.posX + (e.changedTouches[0].clientX - draggedModal.lastMouseX);
            draggedModal.posY = draggedModal.posY + (e.changedTouches[0].clientY - draggedModal.lastMouseY);
            draggedModal.lastMouseX = e.changedTouches[0].clientX;
            draggedModal.lastMouseY = e.changedTouches[0].clientY;

            draggedModal.setAttribute("style", `${draggedModal.zindex}background: rgba(var(--color_r), var(--color_g), var(--color_b), 0.5);left: ${draggedModal.posX}px;top: ${draggedModal.posY}px;`);
        }
        function modalTouchendHandler(e) {
            window.removeEventListener("touchmove", modalTouchmoveHandler);
            draggedModal.setAttribute("style", `${draggedModal.zindex}left: ${draggedModal.posX}px;top: ${draggedModal.posY}px;`);

            window.removeEventListener("touchend", modalTouchendHandler);
        }
        dragTarget.addEventListener("touchstart", modalTouchstartHandler);
    });
</script>

<div
    bind:this={modal.element}
    on:mousedown={() => modal.focus()}
    on:touchstart={() => modal.focus()}
    id="modal_{modal.id}"
    class="{modal.classes}"
    style="z-index:{modal.actualZindex};"
    augmented-ui="{modal.augs} exe">
    <h1>{modal.title}</h1>
    {#if modal.type === "custom"}
        {#if modal.options.component}
            <svelte:component this={modal.options.component} {...modal.options.arguments} />
        {:else}
            {@html modal.options.html}
        {/if}
    {:else}
        <h5>{@html modal.message}</h5>
    {/if}
    <div>
    {#if modal.buttons}
        {#each modal.buttons as button}
            <button on:click={button.action}>{button.label}</button>
        {/each}
    {/if}
    </div>
</div>