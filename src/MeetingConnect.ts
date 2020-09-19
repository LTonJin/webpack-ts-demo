import EventEmitter from "wolfy87-eventemitter";
import { Session } from "./Session";
import { LibMediasoupClient } from "./LibMediasoupClient";
import { Logger } from "./utils/ButelLogger";
const log: any = new Logger("MeetingConnect");

export class MeetingConnect extends EventEmitter {
    session = new Session();
    libMediasoupClient = new LibMediasoupClient();
    meetingInfo: any;
    constructor() {
        super();
    }
    init() {
        this.startListener();
        this.session.init();
        this.libMediasoupClient.init(this.session);
    }
    destroy() {
        this.stopListener();
        this.session.destroy();
        this.libMediasoupClient.destroy();
    }
    startListener() {
        // 监听socket连接状态
        this.session.on("connect", (data: any) => {
            if (data.res === 1) {
                this.libMediasoupClient.loadDevice({});
            }
        });

        // 本端开始发言通知
        this.session.on("start_speak_notify", () => {
            console.log("start_speak_notify");
            this.meetingInfo.transportPramas.forEach(async (item: any) => {
                if (item.direction === 0) {
                    await this.libMediasoupClient.publish();
                }
            });
        });

        // 本端停止发言通知
        this.session.on("stop_speak_notify", () => {
            console.log("stop_speak_notify");
        });

        // 本端被踢下线通知
        this.session.on("kick_out_notify", () => {
            console.log("kick_out_notify");
        });

        // 议室成员加入通知
        this.session.on("user_join_notify", (data: any) => {
            console.log(data, "user_join_notify");
        });

        // 会议室成员退出通知
        this.session.on("user_leave_notify", (data: any) => {
            console.log(data, "user_leave_notify");
        });

        // 会议模式被改变通知
        this.session.on("meeting_mode_change_notify", (data: any) => {
            console.log(data, "meeting_mode_change_notify");
        });

        // 收到主持人远程控制摄像头和Mic的通知
        this.session.on("host_control_notify", (data: any) => {
            console.log(data, "host_control_notify");
        });

        // 主持人收到用户举手通知
        this.session.on("raise_hand_notify", (data: any) => {
            console.log(data, "raise_hand_notify");
        });

        // 收到主持人被移交通知
        this.session.on("host_transfer_notify", (data: any) => {
            console.log(data, "host_transfer_notify");
        });

        // 即时消息通知
        this.session.on("recv_ui_msg_notify", (data: any) => {
            console.log(data, "recv_ui_msg_notify");
        });

        // 其他用户开始发言通知
        this.session.on("user_start_speak_notify", (data: any) => {
            console.log(data, "user_start_speak_notify");
            if (document.getElementById(`remote_td_${data.userId}`)) {
            } else {
                const tdTemp: any = document.createElement("div");
                tdTemp.id = "remote_td_" + data.userId;
                tdTemp.innerHTML = `<div>remote_video_${data.userId}</div><video id="remote_video_${data.userId}" controls autoplay playsinline></video>`;
                document.body.appendChild(tdTemp);
            }
        });

        // 其他用户停止发言通知
        this.session.on("user_stop_speak_notify", (data: any) => {
            console.log(data, "user_stop_speak_notify");
        });

        // 会议结束通知
        this.session.on("meeting_end_notify", () => {
            console.log("meeting_end_notify");
        });

        // 会议异常通知
        this.session.on("meeting_exception_notify", () => {
            console.log("meeting_exception_notify");
        });

        // 发言者发布视频通知
        this.session.on("user_publish_video_notify", async (data: any) => {
            console.log(data, "user_publish_video_notify");
            this.libMediasoupClient.subscribe(data.userId, "video");
        });

        // 发言者取消发布视频流通知
        this.session.on("user_unpublish_video_notify", (data: any) => {
            console.log(data, "user_unpublish_video_notify");
        });

        // 发言者发布音频流通知
        this.session.on("user_publish_audio_notify", (data: any) => {
            console.log(data, "user_publish_audio_notify");
        });

        // 发言者取消发布音频流通知
        this.session.on("user_unpublish_audio_notify", (data: any) => {
            console.log(data, "user_unpublish_audio_notify");
        });

        // 发言者发布文档视频流通知
        this.session.on("user_publish_share_notify", (data: any) => {
            console.log(data, "user_publish_share_notify");
        });

        // 发言者取消发布文档视频流通知
        this.session.on("user_unpublish_share_notify", (data: any) => {
            console.log(data, "user_unpublish_share_notify");
        });
    }
    stopListener() {
        this.session.removeEvent("connect");
    }
    async join_meeting(
        userId: string,
        token: string,
        meetingId: string,
        isSpeak: boolean,
        nickName: string
    ) {
        const res = await this.session.join_meeting(
            userId,
            token,
            meetingId,
            isSpeak,
            nickName
        );
        if (res.ret === 0) {
            await this.libMediasoupClient.loadDevice(res.routerRtpCapabilities);
            this.meetingInfo = res;
            res.transportPramas.forEach(async (item: any) => {
                // 加入会议成功创建接受发送transport
                if (item.direction === 0) {
                    // produce的transport参数
                    const params = {
                        id: item.transportId,
                        iceParameters: item.iceParameters,
                        iceCandidates: item.iceCandidates,
                        dtlsParameters: item.dtlsParameters,
                    };
                    this.libMediasoupClient.createSendTransport(params);
                } else if (item.direction === 1) {
                    // consume的transport参数
                    const params = {
                        id: item.transportId,
                        iceParameters: item.iceParameters,
                        iceCandidates: item.iceCandidates,
                        dtlsParameters: item.dtlsParameters,
                    };
                    await this.libMediasoupClient.createRecvTransport(params);
                    // 发言人列表循环订阅
                    // res.speakers.forEach((speaker: any) => {
                    //     if (speaker.videoStreamState === 1) {
                    //         this.libMediasoupClient.subscribe(
                    //             speaker.userId,
                    //             "video",
                    //             this.session
                    //         );
                    //     }
                    //     if (speaker.audioStreamState === 1) {
                    //         this.libMediasoupClient.subscribe(
                    //             speaker.userId,
                    //             "audio",
                    //             this.session
                    //         );
                    //     }
                    //     if (speaker.dataStreamState === 1) {
                    //         this.libMediasoupClient.subscribe(
                    //             speaker.userId,
                    //             "share",
                    //             this.session
                    //         );
                    //     }
                    // });
                }
            });
        } else {
            log.info("加入会议失败");
        }
        return res;
    }
    async exit_meeting() {
        return await this.session.exit_meeting();
    }

    async unpublish() {
        this.libMediasoupClient.unpublish("video");
    }
}
