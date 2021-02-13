<script>
    import getIcon from "../data/getIcon";
    import Icon from "./reusable/icon.svelte";

    export var file;
    export var edexIcons;

    var icon = getIcon(file, edexIcons);

    $: icon = getIcon(file, edexIcons);
</script>

{#if icon}
    <Icon {icon} />
{/if}