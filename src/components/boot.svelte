<script>
    import bootLog from "../stores/bootLog";
    import state from "../stores/state";
</script>

<section id="boot_screen" class={$state.bootScreenClasses}>
    {@html $bootLog}
</section>