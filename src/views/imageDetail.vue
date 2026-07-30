<template>
    <div class="show-image">

        <div class="image canvas" ref="canvasDiv">
            <img class="base-img" @load="readQrcode" ref="img" :src="url" :style="controlStyle" crossorigin="" />
            <div class="canvas-div-post edit-canvas" :style="controlStyle">
                <canvas ref="canvas" />
            </div>
        </div>
        <div class="value" v-if="res.res && res.res.length">
            <el-input v-model="textarea" autosize type="textarea" placeholder="" />
        </div>

    </div>
</template>

<script>
import { fabric } from 'fabric'
import Control from "../tools/control.js"
const ipcRenderer = require('electron').ipcRenderer;
const { shell } = require('electron');

export default {
    name: 'showImage',
    data() {
        return {
            url: "",
            res: {},
            textarea: "",
            toolType: 'move',
            canvas: {},
            controlObj: {},
            controlStyle: {}
        }
    },
    methods: {
        async readQrcode() {
            const detector = new BarcodeDetector({
                formats: ['qr_code'],
            });
            let img = this.$refs.img
            detector.detect(img).then(result => {
                console.log('result: ', result);
                let that = this
                result.forEach(obj => {
                    // 2. 定义梯形的四个点
                    var points = obj.cornerPoints
                    // 3. 使用 fabric.Polygon 创建梯形
                    var trapezoid = new fabric.Polygon(points, {
                        fill: 'red',           // 填充颜色
                        stroke: 'black',        // 边框颜色
                        strokeWidth: 2,         // 边框宽度
                        opacity: 0.2,
                        hasControls: false,
                        // evented: false,
                        lockMovementX: true,    // 锁定 X 轴移动
                        lockMovementY: true,     // 锁定 Y 轴移动
                        selectable: true,
                        hasBorders: false,
                        objectCaching: false    // 禁用对象缓存，使得动态更新更流畅
                    });
                    this.canvas.add(trapezoid);

                    trapezoid.on('mousedown', function (e) {
                        const now = new Date().getTime();
                        if (this.lastClick && now - this.lastClick < 300) {
                            // 双击时的逻辑
                            console.log('双击事件！', obj.rawValue);
                            try {
                                shell.openExternal(obj.rawValue);
                            } catch (error) {
                                console.log('error: ', error);
                            }
                        } else {
                            // 单击时的逻辑
                            try {
                                navigator.clipboard.writeText(obj.rawValue)
                                    .then(() => {
                                        this.$message('二维码内容已成功复制到剪切板');
                                    })
                                    .catch(err => {
                                        that.copyToClipboard(obj.rawValue)
                                    });
                            } catch (error) {
                                that.copyToClipboard(obj.rawValue)
                            }

                        }
                        this.lastClick = now;
                    });
                })

            });

        },
        renderCanvas() {
            let that = this
            this.res.res.forEach(obj => {
                // 2. 定义梯形的四个点
                var points = [
                    { x: obj.points[0][0], y: obj.points[0][1] },  // 左下角
                    { x: obj.points[1][0], y: obj.points[1][1] },  // 右上角
                    { x: obj.points[2][0], y: obj.points[2][1] },  // 右下角
                    { x: obj.points[3][0], y: obj.points[3][1] }   // 左上角
                ];
                // 3. 使用 fabric.Polygon 创建梯形
                var trapezoid = new fabric.Polygon(points, {
                    fill: 'blue',           // 填充颜色
                    stroke: 'black',        // 边框颜色
                    strokeWidth: 2,         // 边框宽度
                    opacity: 0.2,
                    hasControls: false,
                    // evented: false,
                    lockMovementX: true,    // 锁定 X 轴移动
                    lockMovementY: true,     // 锁定 Y 轴移动
                    selectable: true,
                    hasBorders: false,
                    objectCaching: false    // 禁用对象缓存，使得动态更新更流畅
                });
                this.canvas.add(trapezoid);

                trapezoid.on('mousedown', function (e) {
                    const now = new Date().getTime();
                    if (this.lastClick && now - this.lastClick < 300) {
                        // 双击时的逻辑
                        console.log('双击事件！', obj.value);
                    } else {
                        // 单击时的逻辑
                        try {
                            navigator.clipboard.writeText(obj.value)
                                .then(() => {
                                    this.$message('内容已成功复制到剪切板');
                                })
                                .catch(err => {
                                    that.copyToClipboard(obj.value)
                                });
                        } catch (error) {
                            that.copyToClipboard(obj.value)
                        }

                    }
                    this.lastClick = now;
                });
            })




        },
        init() {
            let that = this

            fabric.Image.fromURL(
                this.url,
                async function (img, error) {
                    that.canvas.setDimensions({ width: img.width, height: img.height })
                    that.canvas.renderAll()
                    that.controlObj.w = img.width
                    that.controlObj.h = img.height
                    that.controlObj.scale = img.width / img.height
                    that.$set(that.controlStyle, "width", img.width + "px")
                    that.$set(that.controlStyle, "height", img.height + "px")
                    console.log('controlStyle: ', that.controlStyle);

                    let prevDomControl = new Control(that.$refs.canvasDiv, "domControl")
                    console.log('domControl: ');
                    prevDomControl.addListeners(that.changeControl)
                    that.changeSize(0)
                },
                {
                    crossOrigin: "anonymous",
                }
            )

        },
        changeControl(type, arg, id) {
            let controlObj = this.controlObj, controlStyle = JSON.parse(JSON.stringify(this.controlStyle))
            switch (type) {
                case "zoom":
                    let zoom = arg[0] > 0 ? 0.9 : 1.1
                    let rate = Math.floor((((controlObj.nw || controlObj.w) * zoom) / controlObj.w) * 100)
                    if (rate < 5) {
                        return false
                    } else if (rate > 500) {
                        zoom = (5 * controlObj.w) / (controlObj.nw || controlObj.w)
                    }
                    controlObj.nw = (controlObj.nw || controlObj.w) * zoom
                    controlObj.nh = (controlObj.nh || controlObj.h) * zoom

                    controlStyle.width = controlObj.nw + "px"
                    controlStyle.height = controlObj.nh + "px"
                    controlObj.t = (-controlObj.t + arg[2]) * (1 - zoom) + controlObj.t
                    controlObj.l = (-controlObj.l + arg[1]) * (1 - zoom) + controlObj.l
                    controlStyle.top = controlObj.t + "px"
                    controlStyle.left = controlObj.l + "px"
                    break
                case "move":
                    // if (id == "editDomControl") {
                    if (arg[0] == "mouse" && this.toolType !== "move") {
                        return
                    }
                    // }
                    controlObj.t = controlObj.t - arg[2]
                    controlObj.l = controlObj.l - arg[1]
                    controlStyle.top = controlObj.t + "px"
                    controlStyle.left = controlObj.l + "px"

                    break
                case "init":
                    controlObj.t = arg[0]
                    controlObj.l = arg[1]
                    controlStyle.top = controlObj.t + "px"
                    controlStyle.left = controlObj.l + "px"
                    controlObj.nw = controlObj.w
                    controlObj.nh = controlObj.h

                    controlStyle.width = controlObj.nw + "px"
                    controlStyle.height = controlObj.nh + "px"
                    break
                case "size":
                    controlObj.t = arg[2]
                    controlObj.l = arg[3]
                    controlStyle.top = controlObj.t + "px"
                    controlStyle.left = controlObj.l + "px"
                    controlObj.nw = arg[0]
                    controlObj.nh = arg[1]

                    controlStyle.width = controlObj.nw + "px"
                    controlStyle.height = controlObj.nh + "px"
                    break
                case "click":
                    if (this.toolType == "zoom") {
                        // console.log(arg);
                        let zoom = 1.1
                        let rate = Math.floor((((controlObj.nw || controlObj.w) * zoom) / controlObj.w) * 100)
                        if (rate > 500) {
                            zoom = (5 * controlObj.w) / (controlObj.nw || controlObj.w)
                        }
                        controlObj.nw = (controlObj.nw || controlObj.w) * zoom
                        controlObj.nh = (controlObj.nh || controlObj.h) * zoom

                        controlStyle.width = controlObj.nw + "px"
                        controlStyle.height = controlObj.nh + "px"

                        controlObj.t = (-controlObj.t + arg[2]) * (1 - zoom) + controlObj.t
                        controlObj.l = (-controlObj.l + arg[1]) * (1 - zoom) + controlObj.l
                        controlStyle.top = controlObj.t + "px"
                        controlStyle.left = controlObj.l + "px"
                    } else if (this.toolType == "less") {
                        // console.log(arg);
                        let zoom = 0.9
                        let rate = Math.floor((((controlObj.nw || controlObj.w) * zoom) / controlObj.w) * 100)
                        if (rate < 5) {
                            return false
                        }
                        controlObj.nw = (controlObj.nw || controlObj.w) * zoom
                        controlObj.nh = (controlObj.nh || controlObj.h) * zoom

                        controlStyle.width = controlObj.nw + "px"
                        controlStyle.height = controlObj.nh + "px"

                        controlObj.t = (-controlObj.t + arg[2]) * (1 - zoom) + controlObj.t
                        controlObj.l = (-controlObj.l + arg[1]) * (1 - zoom) + controlObj.l
                        controlStyle.top = controlObj.t + "px"
                        controlStyle.left = controlObj.l + "px"
                    }
                    break


                default:
                    break
            }
            this.controlStyle = controlStyle

        },
        changeSize(size) {
            console.log('size: ', size);
            let controlObj = this.controlObj

            let width = this.$refs.canvasDiv.offsetWidth,
                height = this.$refs.canvasDiv.offsetHeight,
                centerW = this.$refs.canvasDiv.offsetWidth / 2,
                centerH = this.$refs.canvasDiv.offsetHeight / 2
            switch (size) {
                case 1:
                    this.changeControl("init", [-controlObj.h / 2 + centerH, -controlObj.w / 2 + centerW])
                    break
                case 0:
                    if (controlObj.w / width > controlObj.h / height) {
                        let top = -width / controlObj.scale / 2 + centerH,
                            left = -width / 2 + centerW
                        this.changeControl("size", [width, width / controlObj.scale, top, left])
                    } else {
                        let top = -height / 2 + centerH,
                            left = (-height * controlObj.scale) / 2 + centerW
                        this.changeControl("size", [height * controlObj.scale, height, top, left])
                    }
                    break

                default:
                    this.changeControl("zoom", [size > 1 ? -1.1 : 1.1, centerW, centerH])
                    break
            }
        },
        copyToClipboard(text) {
            // 创建一个临时的 textarea 元素
            const tempInput = document.createElement('textarea');
            tempInput.value = text;

            // 隐藏到页面中
            tempInput.style.position = 'absolute';
            tempInput.style.left = '-9999px';
            document.body.appendChild(tempInput);

            // 选中文本并复制
            tempInput.select();
            try {
                const success = document.execCommand('copy');
                if (success) {
                    this.$message('内容已成功复制到剪切板');
                } else {
                    this.$message('复制失败');
                }
            } catch (err) {
                console.error('复制异常:', err);
            }

            // 移除临时元素
            document.body.removeChild(tempInput);
        },

    },
    created() {


    },
    mounted() {
        this.filePath = this.$route.params.url
        this.url = 'file:///' + this.filePath
        console.log('this.url: ', this.url);
        this.canvas = new fabric.Canvas(this.$refs.canvas);
        this.init()
        // this.readQrcode()
        ipcRenderer.invoke("getOcr", {
            filePath: this.filePath,
        }).then(obj => {
            console.log('obj: ', obj);
            this.res = obj
            this.res.res.forEach(element => {
                this.textarea += element.value + '\n'
            });
            this.renderCanvas()


        }).catch(error => {
            console.error('ocr失败', error);
            this.$message({
                type: 'error',
                message: 'ocr失败'
            });
        });
    }
}
</script>
<style scoped lang="less">
.show-image {
    display: flex;
    height: 100vh;
    width: 100vw;
    padding: 5px;
    box-sizing: border-box;

    .image {
        flex: 1;

        img {
            width: 100%;
        }
    }

    .canvas {
        height: 100%;
        position: relative;
        overflow: hidden;
        box-shadow: 1px 1px 3px 2px #0000004d;
        box-sizing: border-box;
        padding: 5px;

        // &>div {
        //   flex: 1;
        //   overflow: hidden;
        //   height: 100%;
        //   position: relative;
        // }
        .button-list {
            position: absolute;
            right: 10px;
            top: 10px;

            .el-icon {
                margin-left: 10px
            }
        }

        .base-img {
            max-width: unset;
            position: absolute;
        }


        .canvas-div-post {
            position: absolute;

            & :deep(.canvas-container) {
                width: auto !important;
                height: 100% !important;
            }
        }



        .canvas-div-post.edit-canvas {
            background-color: transparent !important;
        }

        & :deep(canvas) {
            width: auto !important;
            height: 100% !important;
        }
    }

    .value {
        flex: 1;
        padding: 10px;

        & :deep(.el-textarea) {
            height: 100% !important;
        }

        & :deep(textarea) {
            height: 100% !important;
        }

    }
}
</style>
