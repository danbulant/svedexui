import { Howl, Howler } from "howler";
const path = require("path");

class AudioManager {
    constructor() {
        if(true) {
            if(true) {
                this.stdout = new Howl({
                    src: [path.join("assets", "audio", "stdout.wav")],
                    volume: 0.4
                });
                this.stdin = new Howl({
                    src: [path.join("assets", "audio", "stdin.wav")],
                    volume: 0.4
                });
                this.folder = new Howl({
                    src: [path.join("assets", "audio", "folder.wav")]
                });
                this.granted = new Howl({
                    src: [path.join("assets", "audio", "granted.wav")]
                });
            }
            this.keyboard = new Howl({
                src: [path.join("assets", "audio", "keyboard.wav")]
            });
            this.theme = new Howl({
                src: [path.join("assets", "audio", "theme.wav")]
            });
            this.expand = new Howl({
                src: [path.join("assets", "audio", "expand.wav")]
            });
            this.panels = new Howl({
                src: [path.join("assets", "audio", "panels.wav")]
            });
            this.scan = new Howl({
                src: [path.join("assets", "audio", "scan.wav")]
            });
            this.denied = new Howl({
                src: [path.join("assets", "audio", "denied.wav")]
            });
            this.info = new Howl({
                src: [path.join("assets", "audio", "info.wav")]
            });
            this.alarm = new Howl({
                src: [path.join("assets", "audio", "alarm.wav")]
            });
            this.error = new Howl({
                src: [path.join("assets", "audio", "error.wav")]
            });

            Howler.volume(1);
        } else {
            Howler.volume(0.0);
        }

        // Return a proxy to avoid errors if sounds aren't loaded
        return new Proxy(this, {
            get: (target, sound) => {
                if (sound in target) {
                    return target[sound];
                } else {
                    return {
                        play: () => {return true;}
                    }
                }
            }
        });
    }
}

const audioManager = new AudioManager();

export { AudioManager };
export default audioManager;