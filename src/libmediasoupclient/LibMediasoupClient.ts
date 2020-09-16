const mediasoup = require("mediasoup-client");
import { Logger } from "../utils/ButelLogger";
const log: any = new Logger("LibMediasoupClient");

export class LibMediasoupClient {
    
    device: any;
    sendTransport: any;
    recvTransport: any;
    producer: any;
    constructor() {}
    init() {
        // this.startListener();
    }
    destroy() {
        // this.stopListener();
    }
    // startListener() {
    //     this.seesion.on('connect', (data: any) => {
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
    async createSendTransport(data: any) {
        this.sendTransport = this.device.createSendTransport(data);
    }
    async createRecvTransport(data: any) {
        this.recvTransport = this.device.createRecvTransport(data);
    }
    // 创建本地produce
    async produce( stream: any) {
        // let stream;
        try {
            // stream = await this.getUserMedia();
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
            this.producer = await this.sendTransport.produce(params);
        } catch (err) {
            log.info('创建本地produce失败');
        }
    }
    // 获取媒体流
    async getUserMedia(isWebcam = true) {
        if (!this.device.canProduce("video")) {
            log.error("cannot produce video");
            return;
        }

        let stream;
        try {
            const media: any = navigator.mediaDevices;
            stream = isWebcam
                ? await media.getUserMedia({ video: true })
                : await media.getDisplayMedia({ video: true });
        } catch (err) {
            log.error("getUserMedia() failed:", err.message);
            throw err;
        }
        return stream;
    }

    // 创建本地consume
    async consume(transport: any, data: any) {
        const {
            producerId,
            id,
            kind,
            rtpParameters,
        } = data;
    
        let codecOptions = {};
        const consumer = await transport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions,
        });
        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        return {stream, consumerID: id};
    }

    // 订阅
    async subscribe() {

    }
}
