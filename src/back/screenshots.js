import {
    globalShortcut,
    clipboard, nativeImage
} from "electron";
const Screenshots = require("electron-screenshots")
const { tempPath } = require('./config')
const fs = require('fs')
const path = require('path')
const { createWindow } = require('./win')
// app.whenReady().then(() => {
// });
const createScreenshots = () => {

    const screenshots = new Screenshots({
        singleWindow: true
    });
    screenshots.start = () => {
        globalShortcut.register("esc", () => {
            if (screenshots.$win && screenshots.$win.isFocused()) {
                screenshots.endCapture();
                globalShortcut.unregister('esc')
            }
        });
        screenshots.startCapture();
    }
    screenshots.close = () => {
        globalShortcut.unregister('esc')
    }



    globalShortcut.register("ctrl+alt+x", () => {
        console.log('screenshots: ', screenshots.$view.getBounds());
        screenshots.start();
        // screenshots.$view.webContents.openDevTools();
    });
    globalShortcut.register("Command+Control+x", () => {
        screenshots.start();
        // screenshots.$view.webContents.openDevTools();
    });

    // 点击确定按钮回调事件
    screenshots.on("ok", async (e, buffer, bounds) => {
        screenshots.close()

        const image = nativeImage.createFromBuffer(buffer);
        clipboard.writeImage(image);
        const imgUrl = path.join(tempPath, Date.now()+'.png')
        fs.writeFileSync(imgUrl, buffer)
        createWindow('imageDetail',{
            url:imgUrl
        })

    });
    screenshots.on("cancel", (e) => {
        screenshots.close()
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
        screenshots.close()
    });
    return screenshots;
}
export {
    createScreenshots
}