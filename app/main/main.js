const { app, BrowserWindow, Menu, ipcMain, globalShortcut, desktopCapturer } = require("electron");
const path = require("path");
const fs = require("fs");
const MainWindow = require("./MainWindow");

process.env.NODE_ENV = "development";

const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let overlayWindow;

function createMainWindow() {
    mainWindow = new MainWindow("./app/main/index.html", isDev);
}

app.on("ready", () => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on("ready", () => (mainWindow = null));
    
    globalShortcut.register("Alt+Shift+S", () => {
        createOverlayWindow();
    });

});

const menu = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
        role: "fileMenu",
    },
    {
        label: "View",
        submenu: [
            {
                label: "Toggle Navigation",
                click: () => mainWindow.webContents.send("nav:toggle"),
            },
        ],
    },
    ...(isDev
        ? [
            {
                label: "Developer",
                submenu: [
                    { role: "reload" },
                    { role: "forcereload" },
                    { type: "separator" },
                    { role: "toggledevtools" },
                ],
            },
        ]
        : []),
];


app.on("window-all-closed", () => {
    if (!isMac) {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});


// ✅ 오버레이 창 생성
function createOverlayWindow() {
    overlayWindow = new BrowserWindow({
        fullscreen: true,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    overlayWindow.loadFile("./app/main/overlay.html");

    overlayWindow.on("closed", () => {
        overlayWindow = null;
    });
}

// ✅ 캡처 요청을 받으면 스크린샷 촬영 후 저장
ipcMain.on("capture-screen", async (event, bounds) => {
    const { x, y, width, height } = bounds;

    const sources = await desktopCapturer.getSources({ types: ["screen"] });
    const screenShot = sources[0];

    const image = screenShot.thumbnail.crop({ x, y, width, height });

    fs.writeFileSync("screenshot.png", image.toPNG());
});

// ✅ 오버레이 창 닫기
ipcMain.on("close-overlay", () => {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
    }
});

app.allowRendererProcessReuse = true;
