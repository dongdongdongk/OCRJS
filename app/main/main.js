const { app, BrowserWindow, Menu, ipcMain, globalShortcut, desktopCapturer, screen, shell } = require("electron");
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
    try {
        const { x, y, width, height } = bounds;
        
        // 전체 화면 캡처
        const sources = await desktopCapturer.getSources({ 
            types: ["screen"],
            thumbnailSize: {
                width: screen.getPrimaryDisplay().size.width,
                height: screen.getPrimaryDisplay().size.height
            }
        });
        
        const screenShot = sources[0];
        
        // 실제 화면 크기와 썸네일 크기의 비율 계산
        const displayWidth = screen.getPrimaryDisplay().size.width;
        const displayHeight = screen.getPrimaryDisplay().size.height;
        const thumbnailWidth = screenShot.thumbnail.getSize().width;
        const thumbnailHeight = screenShot.thumbnail.getSize().height;
        
        // 비율에 맞게 좌표 변환
        const scaledBounds = {
            x: Math.floor(x * (thumbnailWidth / displayWidth)),
            y: Math.floor(y * (thumbnailHeight / displayHeight)),
            width: Math.floor(width * (thumbnailWidth / displayWidth)),
            height: Math.floor(height * (thumbnailHeight / displayHeight))
        };
        
        const image = screenShot.thumbnail.crop(scaledBounds);
        const imagePath = path.join(app.getPath('pictures'), `screenshot_${Date.now()}.png`);
        fs.writeFileSync(imagePath, image.toPNG());

        // 캡처 완료 시 메인 윈도우에 이미지 경로 전송
        if (mainWindow) {
            mainWindow.webContents.send('capture-complete', imagePath);
        }
    } catch (error) {
        console.error('Screenshot error:', error);
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


app.allowRendererProcessReuse = true;
