import EventEmitter from "wolfy87-eventemitter";
import { Seesion } from "../session/Session";
import { LibMediasoupClient } from "../libmediasoupclient/LibMediasoupClient";
import { Logger } from "../utils/ButelLogger";
const log: any = new Logger("Session");

export class MeetingConnect extends EventEmitter {
    seesion = new Seesion();
    libMediasoupClient = new LibMediasoupClient();
    constructor() {
        super();
    }
    init() {
        this.startListener();
        this.seesion.init();
        this.libMediasoupClient.init();
    }
    destroy() {
        this.stopListener();
        this.seesion.destroy();
        this.libMediasoupClient.destroy();
    }
    startListener() {
        // 监听socket连接状态
        this.seesion.on("connect", (data: any) => {
            if (data.res === 1) {
                this.libMediasoupClient.loadDevice({});
            }
        });
    }
    stopListener() {
        this.seesion.removeEvent("connect");
    }
    async join_meeting(
        userId: string,
        token: string,
        meetingId: string,
        isSpeak: number,
        nickName: string
    ) {
        const res = await this.seesion.join_meeting(
            userId,
            token,
            meetingId,
            isSpeak,
            nickName
        );
        if (res.ret === 0 && isSpeak === 1) {
            // 加入会议并且申请发言成功
            // this.seesion.ask_for_speak();
        } else if (res.ret === 0) {
            // 加入会议成功
            await this.libMediasoupClient.loadDevice(res.routerRtpCapabilities);
            
            res.transportPrama.forEach( async (item: any) => {
                if (item.direction === 0) { // produce的transport参数
                    this.libMediasoupClient.createSendTransport( item );
                    this.libMediasoupClient.sendTransport.on('connect', async ({dtlsParameters}:any, callback:any, errback:any) => {
                        this.seesion.produce_connect({dtlsParameters})
                            .then(callback)
                            .catch(errback);
                    });
                    this.libMediasoupClient.sendTransport.on('produce', async ({kind, rtpParameters}:any, callback:any, errback:any) => {
                        try {
                            const {id}:any = await this.seesion.produce({
                                transportId: this.libMediasoupClient.sendTransport.id,
                                kind,
                                rtpParameters,
                            });
                            callback({id});
                        } catch (err) {
                            errback(err);
                        }
                    });
                    this.libMediasoupClient.sendTransport.on('connectionstatechange', async (state: string) => {
                        switch (state) {
                            case 'connecting':
                                break;
                            case 'connected':
                                const localVideo: any = document.querySelector('#local_video');
                                localVideo.srcObject = stream;
                                break;
                            case 'failed':
                                this.libMediasoupClient.sendTransport.close();
                                break;
                            default:
                                break;
                        }
                    });
                    let stream = await this.libMediasoupClient.getUserMedia();
                    this.libMediasoupClient.produce(stream);
                } else if (item.direction === 1) {// consume的transport参数

                }
            });
            

            this.libMediasoupClient.createRecvTransport(
                res.transportPramas
            );
        } else {
            // 加入会议失败
            log.info("加入会议失败");
        }
        return res;
    }
    async exit_meeting() {
        return await this.seesion.exit_meeting();
    }
}
