import {
    app, dialog, Notification, shell, BrowserWindow, screen,
    globalShortcut,
    clipboard, nativeImage
} from "electron";
const jsQR = require("jsqr");
const PNG = require('pngjs').PNG;
const Screenshots = require("electron-screenshots")
app.whenReady().then(() => {
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
        // 解析PNG图像
        // const png = PNG.sync.read(image.toPNG());
        // // 创建二维码读取器
        // const qr = new QrCode();
        // // 设置回调函数
        // qr.callback = async function (err, result) {
        //     if (err || !result.result) {
        //         console.log('二维码识别失败:', err,result);
        //     } else {
        //         console.log('二维码内容:', result.result);
        //         // 非用户事件无法执行
        //         // clipboard.write({ text: result.result});
        //         // screenshots.endCapture();
        //         // if (Notification.isSupported()) {
        //         //     let n = new Notification({
        //         //         title: "二维码",
        //         //         body: result.result,
        //         //         silent: true,
        //         //     })
        //         //     // 很烦，经常性无效，或者有时候很久才出来
        //         //     n.once('click',e => {
        //         //         console.log('Notification click');
        //         //         clipboard.write({ text: result.result});
        //         //         shell.openExternal(result.result)
        //         //     });
        //         //     n.show()
        //         // } else {
        //         //     clipboard.write({ text: result.result});
        //         //     shell.openExternal(result.result);
        //         //     // dialog.showMessageBox({
        //         //     //     title: "二维码",
        //         //     //     message: result.result,
        //         //     // });
        //         // }
        //         
        //     }
        // };
        // // 执行识别
        // qr.decode({
        //     width: png.width,
        //     height: png.height
        // }, png.data);

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