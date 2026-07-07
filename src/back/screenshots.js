import {
    app, dialog, Notification, shell, BrowserWindow, screen,
    globalShortcut,
    clipboard, nativeImage
} from "electron";
const jsQR = require("jsqr");
const PNG = require('pngjs').PNG;
const Screenshots = require("electron-screenshots")
// app.whenReady().then(() => {
// });
const createScreenshots = () => { 

    const screenshots = new Screenshots({
        singleWindow: true
    });
    globalShortcut.register("ctrl+alt+x", () => {
        screenshots.startCapture();
        // screenshots.$view.webContents.openDevTools();
    });
    globalShortcut.register("Command+Control+x", () => {
        screenshots.startCapture();
        // screenshots.$view.webContents.openDevTools();
    });
    globalShortcut.register("esc", () => {
        if (screenshots.$win && screenshots.$win.isFocused()) {
            screenshots.endCapture();
        }
    });
    // 点击确定按钮回调事件
    screenshots.on("ok",async (e, buffer, bounds) => {
        const image = nativeImage.createFromBuffer(buffer);
        clipboard.writeImage(image);
        const png = PNG.sync.read(image.toPNG());
        const code = jsQR(png.data, png.width, png.height);
        if (code) {
            // console.log("Found QR code", code);
            const primaryDisplay = screen.getPrimaryDisplay();
            const { width } = primaryDisplay.workAreaSize;
            const win = new BrowserWindow({
                enableLargerThanScreen: true,
                resizable: false,
                movable: false,
                width: 300,
                height: 100,
                x: width - 400, // 留出一些边距
                y: 30,
                title: '截图识别二维码',
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    webSecurity: false,
                    backgroundThrottling: false,
                }
            });
            if (process.env.WEBPACK_DEV_SERVER_URL) {
                await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + '#/notification?text=' + encodeURIComponent(code.data))
            } else {
                await win.loadURL('app://./index.html#/notification?text=' + encodeURIComponent(code.data))
            }
        } else {
            console.log('二维码识别失败:');
        }

    });
    screenshots.on("cancel", (e) => {
        // 执行了preventDefault
        // 点击取消不会关闭截图窗口
        // e.preventDefault();
        console.log("capture", "cancel2");
    });
    // 点击保存按钮回调事件
    screenshots.on("save", (e, buffer, bounds) => {
        console.log("capture", buffer, bounds);
    });
    // 保存后的回调事件
    screenshots.on("afterSave", (e, buffer, bounds, isSaved) => {
        console.log("capture", buffer, bounds);
        console.log("isSaved", isSaved) // 是否保存成功
    });
    return screenshots;
}
export {
    createScreenshots
}