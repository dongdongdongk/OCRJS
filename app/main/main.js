const { app, BrowserWindow, Menu, ipcMain, globalShortcut, desktopCapturer, screen, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const MainWindow = require("./MainWindow");
const { exec } = require('child_process');

process.env.NODE_ENV = "production"; // development

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

// ✅ 캡처 요청을 받으면 Python을 실행하여 이미지 반환
ipcMain.on("capture-screen", (event, bounds) => {
    try {
        const pythonScriptPath = path.join(__dirname, "screen_capture.py");

        // Python 프로세스를 실행하고 결과를 받음
        const pythonProcess = exec(`python "${pythonScriptPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }

            // Python 스크립트에서 출력된 Base64 문자열
            const base64Image = stdout.trim();
            console.log("Base64:", base64Image);

            // Electron 메인 윈도우로 Base64 이미지 전달
            mainWindow.webContents.send('capture-complete', base64Image);
        });

        // Electron → Python으로 좌표값 전달
        console.log("Bounds:", bounds);
        pythonProcess.stdin.write(JSON.stringify(bounds));
        pythonProcess.stdin.end();
    } catch (error) {
        console.error("Screenshot error:", error);
    }
});

// ✅ 오버레이 창 닫기
ipcMain.on("close-overlay", () => {
    if (overlayWindow) {
        overlayWindow.close();
        overlayWindow = null;
    }
});

// 폴더 열기 요청 처리
ipcMain.on("open-folder", (event, path) => {
    shell.showItemInFolder(path);
});


ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('close-window', () => {
    mainWindow.close();
});


app.allowRendererProcessReuse = true;
