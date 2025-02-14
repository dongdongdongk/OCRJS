const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    captureScreen: (bounds) => ipcRenderer.send("capture-screen", bounds),
    closeOverlay: () => ipcRenderer.send("close-overlay"),
    // 캡처 완료 시 이미지 경로 전달
    onCaptureComplete: (callback) => ipcRenderer.on('capture-complete', callback),

    // 폴더 열기 요청
    openFolder: (path) => ipcRenderer.send("open-folder", path),
});