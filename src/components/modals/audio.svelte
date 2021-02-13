<script>
    import icons from "../../data/icons/file-icons.json";
    import Icon from "../reusable/icon.svelte";

    export var path;
</script>

<div>
    <div class="media_container" data-fullscreen="false">
        <!-- svelte-ignore a11y-media-has-caption -->
        <audio class="media fsDisp_mediaDisp" preload="auto">
            <source src={path}>
            Unsupported audio format!
        </audio>
        <div class="media_controls" data-state="hidden">
            <div class="playpause media_button" data-state="play">
                <Icon icon={icons.playArrow} />
            </div>
            <div class="progress_container">
                <div class="progress">
                    <span class="progress_bar"></span>
                </div>
            </div>
            <div class="media_time">00:00:00</div>
            <div class="volume_icon">
                <Icon icon={icons.volumeUp} />
            </div>
            <div class="volume">
                <div class="volume_bkg"></div>
                <div class="volume_bar"></div>
            </div>
        </div>
    </div>
</div>