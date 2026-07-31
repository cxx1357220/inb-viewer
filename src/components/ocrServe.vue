<template>
    <el-popover trigger="hover" :popper-class="!ocrState?'visibility-pop':''" placement="bottom">
        <div class="tip">
            <canvas ref="qrCode"></canvas>
            <span>{{ ocrUrl }}</span>
        </div>
        <el-button slot="reference" size="mini" :type="ocrState ? 'success' : ''"
            @click="startOcr">局域网内ocr服务</el-button>
    </el-popover>
</template>

<script>
var QRCode = require('qrcode')

const ipcRenderer = require('electron').ipcRenderer;
export default {
    name: 'ocr',
    data() {
        return {
            ocrState: false,
            ocrUrl: '',
        }
    },
    mounted() {
        ipcRenderer.on('ocrUrl', (e, str) => {
            if(!str){
                this.ocrState = false
                return
            }
            console.log('str: ', str);
            this.ocrUrl = str
            var canvas = this.$refs.qrCode
            QRCode.toCanvas(canvas, str, {
                height:150,
                width:150
            }, function (error) {
                if (error) console.error(error)
            })

        })
    },
    
    methods: {
        startOcr() {
            this.ocrState = !this.ocrState
            if (!this.ocrState) {
                this.closeOcr()
            } else {
                ipcRenderer.send('startOcr', this.ocrState)
            }
        },
        closeOcr() {
            ipcRenderer.send('closeOcr', this.ocrState)
        },


    }

}
</script>
<style lang="less" scoped>
.el-button{
    margin-right: 10px;
}
</style>