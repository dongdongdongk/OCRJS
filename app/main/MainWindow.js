const { BrowserWindow } = require('electron')
const path = require("path");

class MainWindow extends BrowserWindow {
    constructor(file, isDev) {
        super(
            {
                title: "OCRJS",
                width: isDev ? 1500 : 1200,
                height: 800,
                resizable: isDev ? true : false,
                // show: false,
                // opacity: 0.9,
                backgroundColor: "white",
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    preload: path.join(__dirname, "preload.js"),
                },
            }
        )
        this.loadFile(file);

        if (isDev) {
            this.webContents.openDevTools();
        }
        
    }
}

module.exports = MainWindow