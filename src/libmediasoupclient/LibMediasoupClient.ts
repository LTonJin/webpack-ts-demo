const mediasoup = require("mediasoup-client");
import { Logger } from "../utils/ButelLogger";
const log: any = new Logger("LibMediasoupClient");

export class LibMediasoupClient {
    device: any;
    sendTransport: any;
    recvTransport: any;
    videoProducer: any;
    audioProducer: any;
    consumerList: Map<string, Map<string, any>> = new Map(); // 所消费的流的信息
    constructor() {}
    init() {
        // this.startListener();
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

    // 发布
    async publish(session: any, data: any) {
        this.sendTransport = this.device.createSendTransport(data);
        this.sendTransport.on(
            "connect",
            async ({ dtlsParameters }: any, callback: any, errback: any) => {
                log.info("produce_connect1");
                try {
                    const res = await session.produce_connect(dtlsParameters);
                    log.info("produce_connect ", res);
                    callback();
                } catch (error) {
                    log.info("produce_connect ", error);
                    errback();
                }
            }
        );
        this.sendTransport.on("produce", async ({ kind, rtpParameters }: any, callback: any, errback: any) =>
            {
                try {
                    log.info("produce");
                    const res = await session.produce(kind, rtpParameters);
                    this.subscribe("62000334", "video", session);
                    log.info("produce ", res);
                    callback({ id: res.producerId });
                } catch (err) {
                    errback(err);
                    log.info("produce ", err);
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
        this.produce();
    }

    // 创建接收transport
    async createRecvTransport(session: any, data: any) {
        this.recvTransport = this.device.createRecvTransport(data);
        this.recvTransport.on(
            "connect",
            async ({ dtlsParameters }: any, callback: any, errback: any) => {
                try {
                    const res = await session.cosume_connect(dtlsParameters);
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
        // const stream = this.consume();
    }

    // 创建本地produce
    async produce(kind?: string) {
        let stream;
        try {
            log.info("produce");
            stream = await this.getUserMedia(kind === "share" ? false : true);
            const localVideo: any = document.querySelector("#local_video");
            localVideo.srcObject = stream;
            const track = stream.getVideoTracks()[0];
            const params: any = { track };
            params.encodings = [
                { maxBitrate: 100000 },
                { maxBitrate: 300000 },
                { maxBitrate: 900000 },
            ];
            params.codecOptions = {
                videoGoogleStartBitrate: 1000,
            };
            const audioTrack = stream.getAudioTracks()[0];
            if (kind === "video") {
                this.videoProducer = await this.sendTransport.produce(params);
            } else if (kind === "audio") {
                this.audioProducer = await this.sendTransport.produce({
                    track: audioTrack,
                    codecOptions: {
                        opusStereo: 1,
                        opusDtx: 1,
                    },
                });
            } else {
                // 不传kind和kind = share，默认音视频都订阅
                this.videoProducer = await this.sendTransport.produce(params);
                console.log('this.videoProducer111', this.videoProducer);
                
                this.audioProducer = await this.sendTransport.produce({
                    track: audioTrack,
                    codecOptions: {
                        opusStereo: 1,
                        opusDtx: 1,
                    },
                });
            }
        } catch (err) {
            log.info("创建本地produce失败");
        }
    }

    // 获取媒体流
    async getUserMedia(isWebcam = true) {
        if (
            !this.device.canProduce("video") &&
            !this.device.canProduce("audio")
        ) {
            log.error("cannot produce video and audio");
            return;
        }

        let stream;
        try {
            const media: any = navigator.mediaDevices;
            stream = isWebcam
                ? await media.getUserMedia({ video: true, audio: true })
                : await media.getDisplayMedia({ video: true, audio: true });
        } catch (err) {
            log.error("getUserMedia() failed:", err.message);
            throw err;
        }
        return stream;
    }

    // 订阅
    async subscribe(userId: string, kind: string, session: any) {
        const stream: any = await this.consume(userId, kind, session);
        const video: any = document.createElement("video");
        video.autoplay = true;
        video.controls = true;
        video.playsinline = true;
        document.body.appendChild(video);
        setTimeout(async () => {
            video.srcObject = await stream.stream;
            await session.consume_resume(userId, kind);
        }, 1000);
    }

    // 消费
    async consume(userId: string, kind: string, session: any) {
        const { rtpCapabilities } = this.device;
        const data = await session.consume(userId, kind, rtpCapabilities);
        if (data.ret !== 0) return;
        let codecOptions = {};
        const consumer = await this.recvTransport.consume({
            id: data.consumerId,
            producerId: data.producerId,
            kind: data.kind,
            rtpParameters: data.rtpParameters,
            codecOptions,
        });
        // this.consumerList.set(userId, new Map(kind))
        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        return { stream, consumerId: data.consumerId };
    }

    // 取消发布
    async unpublish(kind: string, session: any) {
        log.info("关闭produce ", kind);
        const res = await session.close_produce(kind);
        res.ret !== 0 && log.info("关闭远端produce ", kind, "失败");
        if (kind === "video") {
            const stream: any = await this.getUserMedia();
            stream.getVideoTracks()?.forEach((track: any) => {
                track.stop();
            });
            console.log('videoProducer', this.videoProducer);
            
            this.videoProducer.close();
            this.videoProducer = null;
        } else if (kind === "audio") {
            const stream: any = await this.getUserMedia();
            stream.getAudioTracks()?.forEach((track: any) => {
                track.stop();
            });
            this.audioProducer.close();
            this.audioProducer = null;
        } else if (kind === "share") {
            const stream: any = await this.getUserMedia(false);
            stream.getVideoTracks()?.forEach((track: any) => {
                track.stop();
            });
            this.videoProducer.close();
            this.videoProducer = null;
        }
        
    }

    // 取消发布视频

    // 取消订阅
    async unsubscribe(userId: string, kind: string) {

    }
}
