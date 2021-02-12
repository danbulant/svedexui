import fileIconsMatcher from "../data/file-icons-match";
import icons from "../data/icons/file-icons.json";

export default function getIcon(e, edexIcons) {
    let icon = "";
    let type = "";
    switch(e.type) {
        case "showDisks":
            icon = icons.showDisks;
            type = "--";
            e.category = "showDisks";
            break;
        case "up":
            icon = icons.up;
            type = "--";
            e.category = "up";
            break;
        case "symlink":
            icon = icons.symlink;
            break;
        case "disk":
            icon = icons.disk;
            break;
        case "rom":
            icon = icons.rom;
            break;
        case "usb":
            icon = icons.usb;
            break;
        case "edex-theme":
            icon = edexIcons.theme;
            type = "eDEX-UI theme";
            break;
        case "edex-kblayout":
            icon = edexIcons.kblayout;
            type = "eDEX-UI keyboard layout";
            break;
        case "edex-settings":
        case "edex-shortcuts":
            icon = edexIcons.settings;
            type = "eDEX-UI config file";
            break;
        case "system":
            icon = edexIcons.settings;
            break;
        case "edex-themesDir":
            icon = edexIcons.themesDir;
            type = "eDEX-UI themes folder";
            break;
        case "edex-kblayoutsDir":
            icon = edexIcons.kblayoutsDir;
            type = "eDEX-UI keyboards folder";
            break;
        default:
            let iconName = fileIconsMatcher(e.name);
            icon = icons[iconName];
            if (typeof icon === "undefined") {
                if (e.type === "file") icon = icons.file;
                if (e.type === "dir") {
                    icon = icons.dir;
                    type = "folder";
                }
                if (typeof icon === "undefined") icon = icons.other;
            } else if (e.category !== "dir") {
                type = iconName.replace("icon-", "");
            } else {
                type = "special folder";
            }
            break;
    }

    if (type === "") type = e.type;
    e.displayType = type;
    return icon;
}