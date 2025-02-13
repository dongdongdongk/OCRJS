const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    captureScreen: (bounds) => ipcRenderer.send("capture-screen", bounds),
    closeOverlay: () => ipcRenderer.send("close-overlay"),
});