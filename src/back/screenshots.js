import {
    app,
    globalShortcut,
    clipboard, nativeImage 
} from "electron";
// import Screenshots from "./screenshots";
const Screenshots = require("electron-screenshots")
app.whenReady().then(() => {
    const screenshots = new Screenshots();
    globalShortcut.register("ctrl+alt+a", () => {
        screenshots.startCapture();
        // screenshots.$view.webContents.openDevTools();
    });
    globalShortcut.register("esc", () => {
        if (screenshots.$win && screenshots.$win.isFocused()) {
            screenshots.endCapture();
        }
    });
    // 点击确定按钮回调事件
    screenshots.on("ok", (e, buffer, bounds) => {
        console.log("capture", buffer, bounds);
        const image = nativeImage.createFromBuffer(buffer);
        clipboard.writeImage(image);

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
});