import audioManager from "./sfx";
var modals = {};

class Modal {
    constructor(options, onclose) {
        if (!options || !options.type) throw "Missing parameters";

        this.type = options.type;
        this.id = require("nanoid").nanoid();
        while (typeof modals[this.id] !== "undefined") {
            this.id = require("nanoid")();
        }
        this.title = options.title || options.type || "Modal window";
        this.message = options.message || "Lorem ipsum dolor sit amet.";
        this.onclose = onclose;
        this.classes = "modal_popup";
        this.options = options;
        let buttons = [];
        let augs = [];
        let zindex = 0;

        // Reserve a slot in window.modals
        modals[this.id] = {};

        switch(this.type) {
            case "error":
                this.classes += " error";
                zindex = 1500;
                buttons.push({ label:"PANIC", action: () => this.close()}, {label:"RELOAD", action: () => window.location.reload(true)});
                augs.push("tr-clip", "bl-rect", "r-clip");
                break;
            case "warning":
                this.classes += " warning";
                zindex = 1000;
                buttons.push({ label:"OK", action: () => this.close()});
                augs.push("bl-clip", "tr-clip", "r-rect", "b-rect");
                break;
            case "custom":
                this.classes += " info custom";
                zindex = 500;
                buttons = options.buttons || [];
                buttons.push({ label:"Close", action: () => this.close()});
                augs.push("tr-clip", "bl-clip");
                break;
            default:
                this.classes += " info";
                zindex = 500;
                buttons.push({ label:"OK", action: () => this.close()});
                augs.push("tr-clip", "bl-clip");
                break;
        }
        this.zindex = zindex;
        this.actualZindex = zindex + Object.keys(modals).length;
        this.augs = augs;
        this.buttons = buttons;

        switch(this.type) {
            case "error":
                audioManager.error.play();
                break;
            case "warning":
                audioManager.alarm.play();
                break;
            default:
                audioManager.info.play();
                break;
        }
        modals[this.id] = this;

        return this.id;
    }

    close() {
        let modalElement = document.getElementById("modal_"+this.id);
        modalElement.setAttribute("class", "modal_popup "+this.type+" blink");
        audioManager.denied.play();
        setTimeout(() => {
            modalElement.remove();
            delete modals[this.id];
        }, 100);
    
        if (typeof this.onclose === "function") {
            this.onclose();
        }
    }

    focus() {
        let modalElement = document.getElementById("modal_"+this.id);
        modalElement.setAttribute("class", this.classes+" focus");
        Object.keys(modals).forEach(id => {
            if (id === this.id) return;
            modals[id].unfocus();
        });
    }

    unfocus() {
        let modalElement = document.getElementById("modal_"+this.id);
        modalElement.setAttribute("class", this.classes);
    }
}

export default Modal;