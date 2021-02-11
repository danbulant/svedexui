// Modules to control application life and create native browser window
const { app, BrowserWindow, dialog, shell, ipcMain: ipc } = require('electron');
const path = require('path');
const serve = require('electron-serve');
const signale = require("signale");
const url = require("url");
const fs = require("fs");
const which = require("which");
const loadURL = serve({ directory: 'public' });

signale.start(`Starting eDEX-UI v${app.getVersion()}`);
signale.info(`With Node ${process.versions.node} and Electron ${process.versions.electron}`);
signale.info(`Renderer is Chrome ${process.versions.chrome}`);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    signale.fatal("Error: Another instance of eDEX is already running. Cannot proceed.");
    app.exit(1);
}

signale.time("Startup");

// Unset proxy env variables to avoid connection problems on the internal websockets
if (process.env.http_proxy) delete process.env.http_proxy;
if (process.env.https_proxy) delete process.env.https_proxy;

try {
    fs.mkdirSync(electron.app.getPath("userData"));
    signale.info(`Created config dir at ${electron.app.getPath("userData")}`);
} catch(e) {
    signale.info(`Base config dir is ${electron.app.getPath("userData")}`);
}


ipc.on("log", (e, type, content) => {
    signale[type](content);
});

let win, tty, extraTtys;

function isDev() {
    return !app.isPackaged;
}

function createWindow() {
    signale.info("Creating window...");
    let display = electron.screen.getPrimaryDisplay();
    let {x, y, width, height} = display.bounds;
    width++; height++;

    win = new BrowserWindow({
        title: "eDEX-UI",
        x,
        y,
        width,
        height,
        show: false,
        resizable: true,
        movable: false,
        fullscreen: false,
        autoHideMenuBar: true,
        frame: false,
        backgroundColor: '#000000',
        webPreferences: {
            devTools: true,
            enableRemoteModule: true,
            contextIsolation: false,
            backgroundThrottling: false,
            webSecurity: true,
            nodeIntegration: true,
            nodeIntegrationInSubFrames: false,
            allowRunningInsecureContent: false,
            experimentalFeatures: settings.experimentalFeatures || false
        },
        icon: isDev() ? path.join(process.cwd(), 'public/favicon.png') : path.join(__dirname, 'public/favicon.png')
    });

    if (isDev()) {
        win.loadURL('http://localhost:5000/');
    } else {
        loadURL(win);
    }

    win.on('closed', function () {
        win = null;
    });

    win.once('ready-to-show', () => {
        signale.complete("Frontend window created!");
        win.show();
        signale.watch("Waiting for frontend connection...");
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    signale.info("All windows closed");
    app.quit();
});

app.on('web-contents-created', (e, contents) => {
    // Prevent creating more than one window
    contents.on('new-window', (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
    });

    // Prevent loading something else than the UI
    contents.on('will-navigate', (e, url) => {
        // if (url !== "http://localhost:5000/") e.preventDefault();
    });
});

app.on('before-quit', () => {
    if(tty) tty.close();
    if(extraTtys) Object.keys(extraTtys).forEach(key => {
        if (extraTtys[key] !== null) {
            extraTtys[key].close();
        }
    });
    signale.complete("Shutting down...");
});

process.on("uncaughtException", e => {
    signale.fatal(e);
    dialog.showErrorBox("eDEX-UI crashed", e.message || "Cannot retrieve error message.");
    if (tty) {
        tty.close();
    }
    if (extraTtys) {
        Object.keys(extraTtys).forEach(key => {
            if (extraTtys[key] !== null) {
                extraTtys[key].close();
            }
        });
    }
    process.exit(1);
});