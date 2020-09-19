const mediasoup = require("mediasoup-client");
import { Logger } from "./utils/ButelLogger";
const log: any = new Logger("LibMediasoupClient");
class Video {
    constructor() {}
}

function createVideo() {
    const dom: any = document.createElement('video');
    dom.controls = true;
    dom.autoplay = true;
    dom.playsinline = true;
    return dom;
}

export class LibMediasoupClient {
    session: any;
    device: any;
    sendTransport: any; // 发送transport
    recvTransport: any; // 接收transport
    videoProducer: any;
    audioProducer: any;
    consumerList: Map<string, Map<string, any>> = new Map(); // 所消费的流的信息

    localMediaStream = new Map(); // 本地音视频流和video dom
    localShareStream = new Map(); // 本地屏幕分享流和video dom


    constructor() {}
    init( session: any) {
        // this.startListener();
        this.session = session;
        this.localMediaStream.set('dom', createVideo());
        this.localMediaStream.set('stream', new Map()); // video和audio流
        this.localShareStream.set('dom', createVideo());
        this.localShareStream.set('stream', new Map()); // share流

        
    }
    destroy() {
        // this.stopListener();
    }
    // startListener() {
    //     this.session.on('connect', (data: any) => {
    //         console.log(data);

    //     })
    // }
    // stopListener() {

    // }

    async loadDevice(routerRtpCapabilities: any) {
        try {
            this.device = new mediasoup.Device();
        } catch (error) {
            if (error.name === "UnsupportedError") {
                log.error("browser not supported");
            }
        }
        await this.device.load({ routerRtpCapabilities });
    }

    // 创建发送transport
    async createSendTransport(data :any) {
        log.info('createSendTransport参数 ', data);
        this.sendTransport = this.device.createSendTransport(data);
        this.sendTransport.on(
            "connect",
            async ({ dtlsParameters }: any, callback: any, errback: any) => {
                log.info("produce_connect请求");
                try {
                    const res = await this.session.produce_connect(dtlsParameters);
                    log.info("produce_connect请求成功 ", res);
                    callback();
                } catch (error) {
                    log.info("produce_connect请求失败 ", error);
                    errback();
                }
            }
        );
        this.sendTransport.on(
            "produce",
            async (
                { kind, rtpParameters }: any,
                callback: any,
                errback: any
            ) => {
                try {
                    log.info("监听produce");
                    let params:any = {};
                    if (kind === 'video') {   
                        // 获取track设置     
                        const streamVideo = this.localMediaStream.get('stream').get('video'); // 视频流
                        const track = streamVideo.getVideoTracks()[0]
                        const setParams = track.getSettings();

                        params.width = setParams.width;
                        params.height = setParams.height;
                        params.framerate = setParams.frameRate;
                        params.bitrate = rtpParameters.maxBitrate;

                    } else if (kind === 'audio') {
                        // 获取track设置 
                        const streamAudio = this.localMediaStream.get('stream').get('audio'); // 音频流
                        const track = streamAudio.getAudioTracks()[0];
                        const setParams = track.getSettings();

                        params.channel = setParams.channelCount;
                        params.samplerate = setParams.sampleRate;
                        params.samplebit = setParams.sampleSize;
                    }
                    const res = await this.session.produce(kind, rtpParameters, params);
                    // this.subscribe("62000334", "video", session);
                    // this.subscribe("62000334", "audio", session);
                    log.info("远端创建produce成功 ", res);
                    callback({ id: res.producerId });
                } catch (err) {
                    errback(err);
                    log.info("远端创建produce失败 ", err);
                }
            }
        );
        this.sendTransport.on(
            "connectionstatechange",
            async (state: string) => {
                switch (state) {
                    case "connecting":
                        log.info("produce_connect connecting");
                        break;
                    case "connected":
                        log.info("produce_connect connected");
                        break;
                    case "failed":
                        log.info("produce_connect failed");
                        this.sendTransport.close();
                        break;
                    default:
                        break;
                }
            }
        );
    }

    // 创建接收transport
    async createRecvTransport( data: any) {
        this.recvTransport = this.device.createRecvTransport(data);
        this.recvTransport.on(
            "connect",
            async ({ dtlsParameters }: any, callback: any, errback: any) => {
                try {
                    const res = await this.session.cosume_connect(dtlsParameters);
                    callback();
                    log.info("cosume_connect ", res);
                } catch (error) {
                    errback();
                    log.info("cosume_connect ", error);
                }
            }
        );
        this.recvTransport.on(
            "connectionstatechange",
            async (state: string) => {
                switch (state) {
                    case "connecting":
                        log.info("cosume_connect connecting");
                        break;

                    case "connected":
                        log.info("cosume_connect connected");
                        break;

                    case "failed":
                        log.info("cosume_connect failed");
                        this.recvTransport.close();
                        break;

                    default:
                        break;
                }
            }
        );
    }

    // 发布
    async publish(kind?: string) {
        try {
            log.info("本地produce");
            await this.getUserMedia('audio');
            await this.getUserMedia('video');
            const videoDom = this.localMediaStream.get('dom');
            const streamVideo = this.localMediaStream.get('stream').get('video'); // 视频流
            const streamAudio = this.localMediaStream.get('stream').get('audio'); // 音频流
            videoDom.srcObject = streamVideo;
            document.body.appendChild(videoDom);

            // 获取视频track
            const track = streamVideo.getVideoTracks()[0];
            const params: any = { track };
            params.encodings = [
                { maxBitrate: 100000 },
                // { maxBitrate: 300000 },
                // { maxBitrate: 900000 },
            ];
            params.codecOptions = {
                videoGoogleStartBitrate: 1000,
            };

            // 获取音频track
            const audioTrack = streamAudio.getAudioTracks()[0];
            if (kind === "video") {
                log.info('发布视频流')
                this.videoProducer = await this.sendTransport.produce(params);
                log.info('发布视频流成功')
            } else if (kind === "audio") {
                log.info('发布音频流')
                this.audioProducer = await this.sendTransport.produce({
                    track: audioTrack,
                    codecOptions: {
                        opusStereo: 1,
                        opusDtx: 1,
                    },
                });
                log.info('发布音频流成功')
            } else if (kind === "share") {
                log.info('屏幕分享')
                this.videoProducer = await this.sendTransport.produce(params);
                log.info('屏幕分享成功')
            } else {
                // 不传kind，默认音视频都发布
                log.info('发布音视频')
                this.videoProducer = await this.sendTransport.produce(params);
                console.log("this.videoProducer111", this.videoProducer);

                this.audioProducer = await this.sendTransport.produce({
                    track: audioTrack,
                    codecOptions: {
                        opusStereo: 1,
                        opusDtx: 1,
                    },
                });
                log.info('发布音视频成功')
            }
        } catch (err) {
            log.info("创建本地produce失败",err);
        }
    }

    // 获取媒体流
    async getUserMedia(kind: 'video' | 'audio' | 'share') {
        if (!this.device.canProduce("video")) {
            log.error("cannot produce video");
            return;
        }

        if (!this.device.canProduce("audio")) {
            log.error("cannot produce audio");
            return;
        }

        let stream;
        try {
            const media: any = navigator.mediaDevices;
            if (kind === 'video') {{
                stream = await media.getUserMedia({ video: true });
                this.localMediaStream.get('stream').set('video', stream);
            }} else if (kind === 'audio') {
                stream = await media.getUserMedia({ audio: true });
                this.localMediaStream.get('stream').set('audio', stream);
            } else {
                stream = await media.getDisplayMedia({ video: true });
                this.localShareStream.get('stream').set('share', stream);
            }

        } catch (err) {
            log.error("getUserMedia() failed:", err.message);
            throw err;
        }
        return stream;
    }

    // 订阅
    async subscribe(userId: string, kind: string) {
        const stream: any = await this.consume(userId, kind);

        const tdTemp:any = document.getElementById(`remote_video_${userId}`);
        if (tdTemp) {
            setTimeout(async () => {
                tdTemp.srcObject = stream;
                await this.session.consume_resume(userId, kind);
            }, 1000);
        }
        
        // tdTemp.id = "remote_td_" + userId;
        // tdTemp.innerHTML = `<div>remote_video_${userId}</div><video id="remote_video_${userId}" controls autoplay playsinline></video>`

        // document.body.appendChild(tdTemp);
        
    }

    // 消费
    async consume(userId: string, kind: string) {
        const { rtpCapabilities } = this.device;
        const data = await this.session.consume(userId, kind, rtpCapabilities);
        if (data.ret !== 0) return;
        let codecOptions = {};
        const consumer = await this.recvTransport.consume({
            id: data.consumerId,
            producerId: data.producerId,
            kind: data.kind,
            rtpParameters: data.rtpParameters,
            codecOptions,
        });

        this.consumerList.set(userId, new Map().set(kind, consumer));
        console.log("consumerList", this.consumerList);

        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        return stream;
        // return { stream, consumerId: data.consumerId };
    }

    // 取消发布
    async unpublish(kind: string) {
        log.info("取消发布 ", kind);
        const res = await this.session.close_produce(kind);
        res.ret !== 0 && log.info("关闭远端produce ", kind, "失败");
        if (kind === "video") {
            const stream: any = this.localMediaStream.get('stream').get('video');
            stream.getVideoTracks()?.forEach((track: any) => {
                track.stop();
            });
            this.videoProducer.close();
            this.videoProducer = null;
            document.body.removeChild(this.localMediaStream.get('dom'));
        } else if (kind === "audio") {
            const stream: any = this.localMediaStream.get('stream').get('audio');
            stream.getAudioTracks()?.forEach((track: any) => {
                track.stop();
            });
            this.audioProducer.close();
            this.audioProducer = null;
        } else if (kind === "share") {
            const stream: any = this.localShareStream.get('stream').get('share');
            stream.getVideoTracks()?.forEach((track: any) => {
                track.stop();
            });
            this.videoProducer.close();
            this.videoProducer = null;
            document.body.removeChild(this.localShareStream.get('dom'));
        }
        log.info("取消发布成功 ");
    }

    // 取消订阅
    async unsubscribe(userId: string, kind: string) {}
}
