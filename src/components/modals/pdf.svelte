<script>
    import icons from "../../data/icons/file-icons.json";
    import Icon from "../reusable/icon.svelte";

    export var source;
</script>

<div>
    <div class="pdf_options">
        <button class="zoom_in">
            <Icon icon={icons.zoomIn} />
        </button>
        <button class="zoom_out">
            <Icon icon={icons.zoomOut} />
        </button>
        <button class="previous_page">
            <Icon icon={icons.arrowBack} />
        </button>
        <span>Page:
            <span class="page_num"></span>
            <span>/</span>
            <span class="page_count"></span>
        </span>
        <button class="next_page">
            <Icon icon={icons.arrowNext} />
        </button>
    </div>
    <div class="pdf_container fsDisp_mediaDisp">
        <canvas class="pdf_canvas" />
    </div>
</div>