<template>
    <span>
        <el-popover trigger="hover" :popper-class="!watchState ? 'visibility-pop' : ''" placement="bottom">
            <div class="tip">
                <canvas ref="qrCode"></canvas>
                <span>{{ watchUrl }}</span>
            </div>
            <el-button slot="reference" size="mini" :type="watchState ? 'success' : ''"
                @click="select">局域网内分享屏幕</el-button>
        </el-popover>
        <el-dialog title="请选择一个窗口" :visible.sync="dialogVisible" width="70%">
            <div class="boxs">
                <div v-for="obj in screenList" @click="checked = obj.id" :class="[obj.id == checked ? 'checked' : '']">
                    <p><img v-if="obj.appIcon" :src="obj.appIcon.toDataURL()">{{ obj.name }}</p>
                    <img :src="obj.thumbnail.toDataURL()" alt="" srcset="">
                </div>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button type="warning" @click="closeWatch" class="close">关 闭</el-button>
                <el-button type="primary" @click="watchMe">确 定</el-button>
            </span>
        </el-dialog>
    </span>
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
            dialogVisible: false,
            screenList: [],
            checked: {},
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
                height: 150,
                width: 150
            }, function (error) {
                if (error) console.error(error)
            })
            this.watchWin()

        })
    },
    methods: {
        select() {
            ipcRenderer.invoke("getScreen").then(list => {
                console.log('list: ', list)
                let idx = list.findIndex(o=>o.id==this.checked)
                if(idx==-1){
                    this.checked = ''
                }
                this.screenList = list
                this.dialogVisible = true
            })
        },
        watchMe() {
            if (!this.checked) {
                this.$message({
                    type: 'warning',
                    message: '请选择一个窗口'
                });
                return false
            }
            this.dialogVisible = false
            if (this.ws) {
                this.watchWin()
            } else {
                ipcRenderer.send('startWs', this.watchState)
            }

        },
        closeWatch() {
            this.watchState = false
            this.dialogVisible = false
            ipcRenderer.send('closeWs', this.watchState)
            try {
                this.stream?.getTracks()
                    .forEach(track => track.stop())
                this.ws?.close()
                this.ws = ''
            } catch (error) {

            }

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
            this.watchState = true
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
        changeMediaStream(s) {
            console.log('this.concatMap: ', this.concatMap);

            this.stream = s
            let audio = s.getAudioTracks()[0],
                video = s.getVideoTracks()[0]
            // 不保证以后只有一个video一个audio轨道，到时候不知道replace哪个track
            for (const key in this.concatMap) {
                let senders = this.concatMap[key].getSenders()
                senders.forEach(sender => {
                    switch (sender.track?.kind) {
                        case 'video':
                            sender.replaceTrack(video).then(() => {
                                console.log('Track replaced successfully!');
                            }).catch(err => {
                                console.error('Failed to replace track:', err);
                            });
                            break;
                        case 'audio':
                            sender.replaceTrack(audio).then(() => {
                                console.log('Track replaced successfully!');
                            }).catch(err => {
                                console.error('Failed to replace track:', err);
                            });
                            break;
                        default:
                            break;
                    }
                })

                // this.concatMap[key].getSenders().forEach(sender => {
                //     this.concatMap[key].removeTrack(sender);
                // });

                // // 添加新的发送轨道
                // s.getTracks().forEach(track => {
                //     this.concatMap[key].addTrack(track);
                // });

                // // 重新协商，重新协商需要重新点击播放！
                // this.concatMap[key].createOffer().then(offer => {
                //     this.concatMap[key].setLocalDescription(offer);
                //     this.ws.send(JSON.stringify({ key: key, msg: offer, msgType: 'offer' }))
                //     return offer 
                // })
                // 不保证以后只有一个video一个audio轨道，到时候不知道replace哪个track
                // console.log('this.concatMap[key]: ', this.concatMap[key].getSenders()[0].replaceTrack);


            }
        },


        watchWin() {
            // 为了同时捕获整个桌面的音视频，传递给 navigator.mediaDevices.getUserMedia 的约束条件需包括 chromeMediaSource: 'desktop'，audio 和 视频，但不应该包括 chromeMediaSourceId 约束。
            const constraints = {
                audio: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: this.checked
                    }
                },
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: this.checked
                    }
                }
            }
            // navigator.mediaDevices.getDisplayMedia({ // 表示同时采集视频金和音频
            //     video: true,
            //     audio: true
            // })
            navigator.mediaDevices.getUserMedia(constraints)
                .then(s => {
                    if (this.watchState) {
                        this.changeMediaStream(s)
                    } else {
                        this.gotMediaStream(s)
                    }
                })
                .catch(e => { console.log(e); });
        }


    }

}
</script>
<style lang="less" scoped>
.close {
    margin-right: 10px;
}

.boxs {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    max-height: 50vh;
    overflow: auto;

    .checked {
        border: 2px solid #409EFF;
    }

    &>div {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        width: calc(100% / 3);
        padding: 5px;
        border: 2px solid transparent;
        border-radius: 5px;
    
        p {
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-all;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            line-height: 20px;
            font-size: 16px;
            img{
                width: 20px;
                margin-right: 6px;
            }
        }

        img {
            width: 100%;
        }
    }
}
</style>