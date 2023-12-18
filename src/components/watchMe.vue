<template>
    <el-popover trigger="hover" :popper-class="!watchState?'visibility-pop':''" placement="bottom">
        <div class="tip">
            <canvas ref="qrCode"></canvas>
            <span>{{ watchUrl }}</span>
        </div>
        <el-button slot="reference" size="mini" :type="watchState ? 'success' : ''"
            @click="watchMe">局域网内分享屏幕</el-button>
    </el-popover>
</template>

<script>
var QRCode = require('qrcode')

const ipcRenderer = require('electron').ipcRenderer;
export default {
    name: 'watchMe',
    data() {
        return {
            watchState: false,
            watchUrl: '',
            stream: '',
            ws: '',
            concatMap: {}
        }
    },
    created() {
    },
    mounted() {
        ipcRenderer.on('watchUrl', (e, str) => {
            this.watchUrl = str
            var canvas = this.$refs.qrCode
            QRCode.toCanvas(canvas, str, {
                height:150,
                width:150
            }, function (error) {
                if (error) console.error(error)
            })
            this.watchWin()

        })
    },
    methods: {
        watchMe() {
            this.watchState = !this.watchState
            if (!this.watchState) {
                this.closeWatch()
            } else {
                ipcRenderer.send('startWs', this.watchState)

            }
        },
        closeWatch() {
            ipcRenderer.send('closeWs', this.watchState)
            this.stream?.getTracks()
                .forEach(track => track.stop())
            this.ws?.close()
        },
        async newConcat(key) {
            let peer = new RTCPeerConnection({
                iceServers: [
                    // {
                    //     urls: "stun:192.168.3.110:3478", 
                    //     username: 'password', // 用户名    
                    //     credential: 'password' // 密码   
                    // },   
                    // {
                    //     urls: "turn:192.168.3.110:3478?transport=udp",
                    //     username: 'password', // 用户名    
                    //     credential: 'password' // 密码    
                    // },
                ]
            });
            // 监听ICE候选信息 如果收集到，就发送给对方
            peer.onicecandidate = async (event) => {
                if (event.candidate) {
                    console.log('send:', event.candidate);
                    this.ws?.send(JSON.stringify({ key: key, msg: event.candidate, msgType: 'candidate' }))
                }
            };
            // addTrack必须要在createOffer之前执行
            this.stream.getTracks().forEach(track => {
                peer.addTrack(track)
            });
            let a = await peer.createOffer()
            await peer.setLocalDescription(a)
            this.ws.send(JSON.stringify({ key: key, msg: a, msgType: 'offer' }))
            this.concatMap[key] = peer
        },

        gotMediaStream(s) {
            this.stream = s
            this.ws = new WebSocket('ws://localhost:3333?v=1&user=father');
            this.ws.onopen = async function () {
                console.log('ws onopen');
            };
            let that = this
            this.ws.onmessage = async function (e) {
                console.log(e);
                let data = JSON.parse(e.data)
                if (data.msgType == 'withMe') {
                    that.newConcat(data.key)
                } else if (data.msgType == 'answer') {
                    await that.concatMap[data.key].setRemoteDescription(data.msg)
                } else if (data.msgType == 'closeMe') {
                    that.concatMap[data.key].close()
                    delete that.concatMap[data.key];
                } else if (data.msgType == 'candidate') {
                    let candidate = new RTCIceCandidate(data.msg);
                    that.concatMap[data.key].addIceCandidate(candidate);
                }
            }
            this.ws.onclose = async function () {
                for (const key in this.concatMap) {
                    this.concatMap[key].close()
                }
            }

        },


        watchWin() {
            // 为了同时捕获整个桌面的音视频，传递给 navigator.mediaDevices.getUserMedia 的约束条件需包括 chromeMediaSource: 'desktop'，audio 和 视频，但不应该包括 chromeMediaSourceId 约束。
            const constraints = {
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop'
                    }
                },
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop'
                    }
                }
            }
            // navigator.mediaDevices.getDisplayMedia({ // 表示同时采集视频金和音频
            //     video: true,
            //     audio: true
            // })
            navigator.mediaDevices.getUserMedia(constraints)
                .then(this.gotMediaStream)
                .catch(e => { console.log(e); });
        }


    }

}
</script>
<style lang="less" scoped>

</style>