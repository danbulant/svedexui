const Pty = require("node-pty");
const Websocket = require("ws").Server;
const Ipc = require("electron").ipcMain;

class Terminal {
    constructor(opts) {

        this.renderer = null;
        this.port = opts.port || 3000;

        this._closed = false;
        this.onclosed = () => {};
        this.onopened = () => {};
        this.onresize = () => {};
        this.ondisconnected = () => {};

        this._disableCWDtracking = false;
        this._getTtyCWD = tty => {
            return new Promise((resolve, reject) => {
                let pid = tty._pid;
                switch(require("os").type()) {
                    case "Linux":
                        require("fs").readlink(`/proc/${pid}/cwd`, (e, cwd) => {
                            if (e !== null) {
                                reject(e);
                            } else {
                                resolve(cwd);
                            }
                        });
                        break;
                    case "Darwin":
                        require("child_process").exec(`lsof -a -d cwd -p ${pid} | tail -1 | awk '{ for (i=9; i<=NF; i++) printf "%s ", $i }'`, (e, cwd) => {
                            if (e !== null) {
                                reject(e);
                            } else {
                                resolve(cwd.trim());
                            }
                        });
                        break;
                    default:
                        reject("Unsupported OS");
                }
            });
        };
        this._getTtyProcess = tty => {
            return new Promise((resolve, reject) => {
                let pid = tty._pid;
                switch(require("os").type()) {
                    case "Linux":
                    case "Darwin":
                        require("child_process").exec(`ps -o comm --no-headers --sort=+pid -g ${pid} | tail -1`, (e, proc) => {
                            if (e !== null) {
                                reject(e);
                            } else {
                                resolve(proc.trim());
                            }
                        });
                        break;
                    default:
                        reject("Unsupported OS");
                }
            });
        };
        this._nextTickUpdateTtyCWD = false;
        this._nextTickUpdateProcess = false;
        this._tick = setInterval(() => {
            if (this._nextTickUpdateTtyCWD && this._disableCWDtracking === false) {
                this._nextTickUpdateTtyCWD = false;
                this._getTtyCWD(this.tty).then(cwd => {
                    if (this.tty._cwd === cwd) return;
                    this.tty._cwd = cwd;
                    if (this.renderer) {
                        this.renderer.send("terminal_channel-"+this.port, "New cwd", cwd);
                    }
                }).catch(e => {
                    if (!this._closed) {
                        console.log("Error while tracking TTY working directory: ", e);
                        this._disableCWDtracking = true;
                        try {
                            this.renderer.send("terminal_channel-"+this.port, "Fallback cwd", opts.cwd || process.env.PWD);
                        } catch(e) {
                            // renderer closed
                        }
                    }
                });
            }

            if (this.renderer && this._nextTickUpdateProcess) {
                this._nextTickUpdateProcess = false;
                this._getTtyProcess(this.tty).then(process => {
                    if (this.tty._process === process) return;
                    this.tty._process = process;
                    if (this.renderer) {
                        this.renderer.send("terminal_channel-"+this.port, "New process", process);
                    }
                }).catch(e => {
                    if (!this._closed) {
                        console.log("Error while retrieving TTY subprocess: ", e);
                        try {
                            this.renderer.send("terminal_channel-"+this.port, "New process", "");
                        } catch(e) {
                            // renderer closed
                        }
                    }
                });
            }
        }, 1000);

        this.tty = Pty.spawn(opts.shell || "bash", (opts.params.length > 0 ? opts.params : (process.platform === "win32" ? [] : ["--login"])), {
            name: opts.env.TERM || "xterm-256color",
            cols: 80,
            rows: 24,
            cwd: opts.cwd || process.env.PWD,
            env: opts.env || process.env
        });

        this.tty.onExit((code, signal) => {
            this._closed = true;
            this.onclosed(code, signal);
        });

        this.wss = new Websocket({
            port: this.port,
            clientTracking: true,
            verifyClient: info => {
                if (this.wss.clients.length >= 1) {
                    return false;
                } else {
                    return true;
                }
            }
        });
        Ipc.on("terminal_channel-"+this.port, (e, ...args) => {
            switch(args[0]) {
                case "Renderer startup":
                    this.renderer = e.sender;
                    if (!this._disableCWDtracking && this.tty._cwd) {
                        this.renderer.send("terminal_channel-"+this.port, "New cwd", this.tty._cwd);
                    }
                    if (this._disableCWDtracking) {
                        this.renderer.send("terminal_channel-"+this.port, "Fallback cwd", opts.cwd || process.env.PWD);
                    }
                    break;
                case "Resize":
                    let cols = args[1];
                    let rows = args[2];
                    try {
                        this.tty.resize(Number(cols), Number(rows));
                    } catch (error) {
                        //Keep going, it'll work anyways.
                    }
                    this.onresized(cols, rows);
                    break;
                default:
                    return;
            }
        });
        this.wss.on("connection", ws => {
            this.onopened(this.tty._pid);
            ws.on("close", (code, reason) => {
                this.ondisconnected(code, reason);
            });
            ws.on("message", msg => {
                this.tty.write(msg);
            });
            this.tty.onData(data => {
                this._nextTickUpdateTtyCWD = true;
                this._nextTickUpdateProcess = true;
                try {
                    ws.send(data);
                } catch (e) {
                    // Websocket closed
                }
            });
        });

        this.close = () => {
            this.tty.kill();
            this._closed = true;
        };
    }
}

module.exports = {
    Terminal
};