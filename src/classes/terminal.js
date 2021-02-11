import audioManager from "./sfx";

class Terminal {
    constructor(opts) {
        if (!opts.parentId) throw "Missing options";

        this.xTerm = require("xterm").Terminal;
        const {AttachAddon} = require("xterm-addon-attach");
        const {FitAddon} = require("xterm-addon-fit");
        const {LigaturesAddon} = require("xterm-addon-ligatures");
        this.Ipc = require("electron").ipcRenderer;

        this.port = opts.port || 3000;
        this.cwd = "";
        this.oncwdchange = () => {};

        this._sendSizeToServer = () => {
            let cols = this.term.cols.toString();
            let rows = this.term.rows.toString();
            while (cols.length < 3) {
                cols = "0"+cols;
            }
            while (rows.length < 3) {
                rows = "0"+rows;
            }
            this.Ipc.send("terminal_channel-"+this.port, "Resize", cols, rows);
        };

        // Support for custom color filters on the terminal - see #483
        let doCustomFilter = (window.isTermFilterValidated) ? true : false;

        // Parse & validate color filter
        if (window.isTermFilterValidated !== true && typeof window.theme.terminal.colorFilter === "object" && window.theme.terminal.colorFilter.length > 0) {
            doCustomFilter = window.theme.terminal.colorFilter.every((step, i, a) => {
                let func = step.slice(0, step.indexOf("("));

                switch(func) {
                    case "negate":
                    case "grayscale":
                        a[i] = {
                            func,
                            arg: []
                        };
                        return true;
                    case "lighten":
                    case "darken":
                    case "saturate":
                    case "desaturate":
                    case "whiten":
                    case "blacken":
                    case "fade":
                    case "opaquer":
                    case "rotate":
                    case "mix":
                        break;
                    default:
                        return false;
                }

                let arg = step.slice(step.indexOf("(")+1, step.indexOf(")"));

                if (typeof Number(arg) === "number") {
                    a[i] = {
                        func,
                        arg: [Number(arg)]
                    };
                    window.isTermFilterValidated = true;
                    return true;
                }

                return false;
            });
        }

        let color = require("color");
        let colorify;
        if (doCustomFilter) {
            colorify = (base, target) => {
                let newColor = color(base);
                target = color(target);

                for (let i = 0; i < window.theme.terminal.colorFilter.length; i++) {
                    if (window.theme.terminal.colorFilter[i].func === "mix") {
                        newColor = newColor[window.theme.terminal.colorFilter[i].func](target, ...window.theme.terminal.colorFilter[i].arg);
                    } else {
                        newColor = newColor[window.theme.terminal.colorFilter[i].func](...window.theme.terminal.colorFilter[i].arg);
                    }
                }

                return newColor.hex();
            };
        } else {
            colorify = (base, target) => {
                return color(base).grayscale().mix(color(target), 0.3).hex();
            };
        }

        let themeColor = `rgb(${window.theme.r}, ${window.theme.g}, ${window.theme.b})`;

        this.term = new this.xTerm({
            cols: 80,
            rows: 24,
            cursorBlink: window.theme.terminal.cursorBlink || true,
            cursorStyle: window.theme.terminal.cursorStyle || "block",
            allowTransparency: window.theme.terminal.allowTransparency || false,
            fontFamily: window.theme.terminal.fontFamily || "Fira Mono",
            fontSize: window.theme.terminal.fontSize || window.settings.termFontSize || 15,
            fontWeight: window.theme.terminal.fontWeight || "normal",
            fontWeightBold: window.theme.terminal.fontWeightBold || "bold",
            letterSpacing: window.theme.terminal.letterSpacing || 0,
            lineHeight: window.theme.terminal.lineHeight || 1,
            scrollback: 1500,
            bellStyle: "none",
            theme: {
                foreground: window.theme.terminal.foreground,
                background: window.theme.terminal.background,
                cursor: window.theme.terminal.cursor,
                cursorAccent: window.theme.terminal.cursorAccent,
                selection: window.theme.terminal.selection,
                black: window.theme.colors.black || colorify("#2e3436", themeColor),
                red: window.theme.colors.red || colorify("#cc0000", themeColor),
                green: window.theme.colors.green || colorify("#4e9a06", themeColor),
                yellow: window.theme.colors.yellow || colorify("#c4a000", themeColor),
                blue: window.theme.colors.blue || colorify("#3465a4", themeColor),
                magenta: window.theme.colors.magenta || colorify("#75507b", themeColor),
                cyan: window.theme.colors.cyan || colorify("#06989a", themeColor),
                white: window.theme.colors.white || colorify("#d3d7cf", themeColor),
                brightBlack: window.theme.colors.brightBlack || colorify("#555753", themeColor),
                brightRed: window.theme.colors.brightRed || colorify("#ef2929", themeColor),
                brightGreen: window.theme.colors.brightGreen || colorify("#8ae234", themeColor),
                brightYellow: window.theme.colors.brightYellow || colorify("#fce94f", themeColor),
                brightBlue: window.theme.colors.brightBlue || colorify("#729fcf", themeColor),
                brightMagenta: window.theme.colors.brightMagenta || colorify("#ad7fa8", themeColor),
                brightCyan: window.theme.colors.brightCyan || colorify("#34e2e2", themeColor),
                brightWhite: window.theme.colors.brightWhite || colorify("#eeeeec", themeColor)
            }
        });
        let fitAddon = new FitAddon();
        this.term.loadAddon(fitAddon);
        this.term.open(document.getElementById(opts.parentId));
        let ligaturesAddon = new LigaturesAddon();
        this.term.loadAddon(ligaturesAddon);
        this.term.attachCustomKeyEventHandler(e => {
            window.keyboard.keydownHandler(e);
            return true;
        });
        this.term.focus();

        this.Ipc.send("terminal_channel-"+this.port, "Renderer startup");
        this.Ipc.on("terminal_channel-"+this.port, (e, ...args) => {
            switch(args[0]) {
                case "New cwd":
                    this.cwd = args[1];
                    this.oncwdchange(this.cwd);
                    break;
                case "Fallback cwd":
                    this.cwd = "FALLBACK |-- "+args[1];
                    this.oncwdchange(this.cwd);
                    break;
                case "New process":
                    if (this.onprocesschange) {
                        this.onprocesschange(args[1]);
                    }
                    break;
                default:
                    return;
            }
        });
        this.resendCWD = () => {
            this.oncwdchange(this.cwd || null);
        };

        let sockHost = opts.host || "127.0.0.1";
        let sockPort = this.port;

        this.socket = new WebSocket("ws://"+sockHost+":"+sockPort);
        this.socket.onopen = () => {
            let attachAddon = new AttachAddon(this.socket);
            this.term.loadAddon(attachAddon);
            this.fit();
        };
        this.socket.onerror = e => {throw JSON.stringify(e)};
        this.socket.onclose = e => {
            if (this.onclose) {
                this.onclose(e);
            }
        };

        this.lastSoundFX = Date.now();
        this.socket.addEventListener("message", e => {
            let d = Date.now();

            if (d - this.lastSoundFX > 30) {
                audioManager.stdout.play();
                this.lastSoundFX = d;
            }
            if (d - this.lastRefit > 10000) {
                this.fit();
            }

            // See #397
            if (!window.settings.experimentalGlobeFeatures) return;
            let ips = e.data.match(/((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)/g);
            if (ips !== null && ips.length >= 1) {
                ips = ips.filter((val, index, self) => { return self.indexOf(val) === index; });
                ips.forEach(ip => {
                    window.mods.globe.addTemporaryConnectedMarker(ip);
                });
            }
        });

        let parent = document.getElementById(opts.parentId);
        parent.addEventListener("wheel", e => {
            this.term.scrollLines(Math.round(e.deltaY/10));
        });
        this._lastTouchY = null;
        parent.addEventListener("touchstart", e => {
            this._lastTouchY = e.targetTouches[0].screenY;
        });
        parent.addEventListener("touchmove", e => {
            if (this._lastTouchY) {
                let y = e.changedTouches[0].screenY;
                let deltaY = y - this._lastTouchY;
                this._lastTouchY = y;
                this.term.scrollLines(-Math.round(deltaY/10));
            }
        });
        parent.addEventListener("touchend", e => {
            this._lastTouch = null;
        });
        parent.addEventListener("touchcancel", e => {
            this._lastTouch = null;
        });

        document.querySelector(".xterm-helper-textarea").addEventListener("keydown", e => {
            if (e.key === "F11" && window.settings.allowWindowed) {
                e.preventDefault();
                window.toggleFullScreen();
            }
        });

        this.fit = () => {
            this.lastRefit = Date.now();
            let {cols, rows} = fitAddon.proposeDimensions();

            // Apply custom fixes based on screen ratio, see #302
            let w = screen.width;
            let h = screen.height;
            let x = 1;
            let y = 0;

            function gcd(a, b) {
                return (b == 0) ? a : gcd(b, a%b);
            }
            let d = gcd(w, h);

            if (d === 100) { y = 1; x = 3;}
            // if (d === 120) y = 1;
            if (d === 256) x = 2;

            if (window.settings.termFontSize < 15) y = y - 1;

            cols = cols+x;
            rows = rows+y;

            if (this.term.cols !== cols || this.term.rows !== rows) {
                this.resize(cols, rows);
            }
        };

        this.resize = (cols, rows) => {
            this.term.resize(cols, rows);
            this._sendSizeToServer();
        };

        this.write = cmd => {
            this.socket.send(cmd);
        };

        this.writelr = cmd => {
            this.socket.send(cmd+"\r");
        };

        this.clipboard = {
            copy: () => {
                if (!this.term.hasSelection()) return false;
                document.execCommand("copy");
                this.term.clearSelection();
                this.clipboard.didCopy = true;
            },
            paste: () => {
                this.write(electron.remote.clipboard.readText());
                this.clipboard.didCopy = false;
            },
            didCopy: false
        };
    }
}

export default Terminal;