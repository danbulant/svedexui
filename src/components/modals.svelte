<script>
    import errorModals from "../stores/errorModals";
    import ErrorModal from "./errorModal.svelte";
</script>

{#each $errorModals as modal}
    <ErrorModal {modal} />
{/each}