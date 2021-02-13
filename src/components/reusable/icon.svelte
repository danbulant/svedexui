<script>
    export var icon;
</script>

<svg viewBox="0 0 {icon.width || 512} {icon.height || 512}" fill="rgb({window.theme.r}, {window.theme.g}, {window.theme.b})">
    {@html icon.svg}
</svg>