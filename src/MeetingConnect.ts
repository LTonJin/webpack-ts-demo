import EventEmitter from "wolfy87-eventemitter";
import { Session } from "./Session";
import { LibMediasoupClient } from "./LibMediasoupClient";
import { Logger } from "./utils/ButelLogger";
import { createVideo } from "./utils/createVideo";
const log: any = new Logger("MeetingConnect");
import store from "./utils/store";

export class MeetingConnect extends EventEmitter {
    session = new Session();
    libMediasoupClient = new LibMediasoupClient();
    meetingInfo: any;
    media_device_list_: any = [
        {
            id: "Camera",
            deviceType: 1,
            current_deviceid: "-1",
            title: "摄像头设备",
            option: [],
        },
        {
            id: "Mic",
            deviceType: 2,
            current_deviceid: "-1",
            title: "麦克风设备",
            option: [],
        },
        {
            id: "AudioOutput",
            deviceType: 3,
            current_deviceid: "-1",
            title: "音频输出设备",
            option: [],
        },
    ];
    //当前是否存在可用的Camera和Mic设备
    isHaveCameraDevice_ = false;
    isHaveMicDevice_ = false;

    camera_id_ = ""; //当前使用摄像头设备id
    mic_id_ = ""; //当前使用的MIc设备id

    camera_id_set_ = "-1"; //当前设置的摄像头设备id
    mic_id_set_ = "-1"; //当前设置的MIc设备id

    camera_setting_: any; //当前摄像头参数设置
    mic_setting_: any; //当前Mic参数设置

    camera_caps_: any; //当前摄像头能力参数
    mic_caps_: any; //当前Mic能力参数
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
        this.session = new Session();
        this.libMediasoupClient = new LibMediasoupClient();
        this.meetingInfo = null;
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
            this.libMediasoupClient.publish();
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
            this.libMediasoupClient.unsubscribe(data.userId, "video");
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
        this.session.removeEvent("start_speak_notify");
        this.session.removeEvent("stop_speak_notify");
        this.session.removeEvent("kick_out_notify");
        this.session.removeEvent("user_join_notify");
        this.session.removeEvent("user_leave_notify");
        this.session.removeEvent("meeting_mode_change_notify");
        this.session.removeEvent("host_control_notify");
        this.session.removeEvent("raise_hand_notify");
        this.session.removeEvent("host_transfer_notify");
        this.session.removeEvent("recv_ui_msg_notify");
        this.session.removeEvent("user_start_speak_notify");
        this.session.removeEvent("user_stop_speak_notify");
        this.session.removeEvent("meeting_end_notify");
        this.session.removeEvent("meeting_exception_notify");
        this.session.removeEvent("user_publish_video_notify");
        this.session.removeEvent("user_unpublish_video_notify");
        this.session.removeEvent("user_publish_audio_notify");
        this.session.removeEvent("user_unpublish_audio_notify");
        this.session.removeEvent("user_publish_share_notify");
        this.session.removeEvent("user_unpublish_share_notify");
    }

    // 加入会议
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

    // 退出会议
    async exit_meeting() {
        return await this.session.exit_meeting();
    }

    // 请求发言
    async ask_for_speak() {
        return await this.session.ask_for_speak();
    }

    // 举手请求发言
    async raise_hand_for_speak() {
        return await this.session.raise_hand_for_speak();
    }

    // 请求停止发言
    async ask_for_stop_speak() {
        return await this.session.ask_for_stop_speak();
    }

    // 获取会议室所有成员
    async get_all_user() {
        return await this.session.get_all_user();
    }

    // 发送UI信息
    async send_ui_message(userId: string, msgId: number, msgData: string) {
        return await this.session.send_ui_message(userId, msgId, msgData);
    }

    /**主持人相关操作************************************ */
    // 指定发言人
    async set_speaker(userId: string, cancelUserId: string) {
        return await this.session.set_speaker(userId, cancelUserId);
    }

    // 请出会议室
    async kick_out_user(userId: string) {
        return await this.session.kick_out_user(userId);
    }

    // 启动本地预览
    async StartLocalPreview(videoContainer: any) {
        log.info("start_local_preview");
        if (!videoContainer) return;

        // 发布流
        await this.libMediasoupClient.publish();
        //显示video对象
        var user_local_video_ = this.libMediasoupClient.localMediaStream.get(
            "dom"
        );
        user_local_video_.srcObject = this.libMediasoupClient.localMediaStream
            .get("stream")
            .get("video");

        //页面video容器添加video对象
        videoContainer.appendChild(user_local_video_);
    }

    // 停止本地预览
    async StopLocalPreview() {
        log.info("stop_local_preview");
        // 取消发布流
        await this.libMediasoupClient.unpublish();
        //隐藏video对象
        var user_local_video_ = this.libMediasoupClient.localMediaStream.get(
            "dom"
        );

        //页面video容器移除video对象
        if (user_local_video_.parentNode)
            user_local_video_.parentNode.removeChild(user_local_video_);
    }

    // 启动远端视频播放
    async StartRemoteVideo(userId: string, videoContainer: any) {
        log.info(`start_remote_video${userId}`);
        if (!videoContainer) return;
        // 订阅流
        await this.libMediasoupClient.subscribe(userId, "video");
        var dom = this.libMediasoupClient.consumerList.get(userId).get("dom");
        if (!dom) return;
        videoContainer.appendChild(dom);
    }

    // 停止远端视频播放
    async StopRemoteVideo(userId: string) {
        log.info(`stop_remote_video${userId}`);
        // 取消订阅
        await this.libMediasoupClient.unsubscribe(userId, "video");
        if (!this.libMediasoupClient.consumerList.get(userId)) return;
        var dom = this.libMediasoupClient.consumerList.get(userId).get("dom");
        //页面video容器移除video对象
        if (dom.parentNode) dom.parentNode.removeChild(dom);
    }

    // 启动远端共享播放
    async StartRemoteShareVideo(userId: string, videoContaine: any) {
        log.info(`start_remote_share_video${userId}`);
        if (!videoContaine) return;

        // 订阅流
        await this.libMediasoupClient.subscribe(userId, "share");
        var userIdInfo = this.libMediasoupClient.consumerList.get(userId);
        var myselfInfo = this.libMediasoupClient.localShareStream;
        if (userId == store.user_id_) {
            myselfInfo.get("dom").srcObject = myselfInfo.get("stream");
        } else if (userIdInfo) {
            setTimeout(() => {
                userIdInfo.get("dom_share").srcObject = userIdInfo.get(
                    "stream_share"
                );
            }, 0);
        } else return;

        //页面video容器添加video对象
        videoContaine.appendChild(userIdInfo.get("dom_share"));
    }
    // 停止远端共享播放
    async StopRemoteShareVideo(userId: string, videoContaine: any) {
        log.info(`start_remote_share_video${userId}`);
        // 取消订阅流
        await this.libMediasoupClient.unsubscribe(userId, "share");
        //页面video容器移除video对象
        var userIdInfo = this.libMediasoupClient.consumerList.get(userId);
        var dom = userIdInfo.get("dom_share");
        if (dom.parentNode)
            userIdInfo.get("dom_share").parentNode.removeChild(dom);
    }

    // 获取媒体设备信息
    async GetMediaDevices() {
        log.info("GetMediaDevices begin");
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.media_device_list_.forEach((d: any) => {
                d.option = [];
                d.current_deviceid = "-1";
            });
            devices.forEach((device) => {
                if (device.kind == "videoinput") {
                    this.media_device_list_.forEach((d: any) => {
                        if (d.deviceType == 1) {
                            //camera
                            d.current_deviceid = this.camera_id_set_;
                            var isUse = 0;
                            if (device.deviceId == this.camera_id_) {
                                isUse = 1;
                            }
                            d.option.push({
                                id: device.deviceId,
                                desc: device.label,
                                used: isUse,
                            });
                        }
                    });
                } else if (device.kind == "audioinput") {
                    this.media_device_list_.forEach((d: any) => {
                        if (d.deviceType == 2) {
                            //mic
                            d.current_deviceid = this.mic_id_set_;
                            var isUse = 0;
                            if (device.deviceId == this.mic_id_) {
                                isUse = 1;
                                //d.current_deviceid=mic_id_;
                            }
                            d.option.push({
                                id: device.deviceId,
                                desc: device.label,
                                used: isUse,
                            });
                        }
                    });
                } else if (device.kind == "audiooutput") {
                    this.media_device_list_.forEach((d: any) => {
                        if (d.deviceType == 3) {
                            //audio output
                            d.option.push({
                                id: device.deviceId,
                                desc: device.label,
                            });
                        }
                    });
                }
            });
            log.info("GetMediaDevices end");
            return this.media_device_list_;
        } catch (error) {
            log.info("GetMediaDevices error", error);
        }
    }

    // 获取本地当前摄像头能力
    GetCameraDeviceCaps() {
        log.info("GetCameraDeviceCaps begin");
        const caps = this.libMediasoupClient.videoProducer.track.getCapabilities();
        const data = {
            aspectRatio: caps.aspectRatio,
            frameRate: caps.frameRate,
            height: caps.height,
            width: caps.width,
        };
        this.camera_caps_ = data;
        log.info("GetCameraDeviceCaps end", data);
        return JSON.stringify(data);
    }

    // 获取本地当前Mic能力
    GetMicDeviceCaps() {
        log.info("GetMicDeviceCaps begin");
        const caps = this.libMediasoupClient.audioProducer.track.getCapabilities();
        const data = {
            channelCount: caps.channelCount,
            sampleRate: caps.sampleRate,
            sampleSize: caps.sampleSize,
        };
        this.mic_caps_ = data;
        log.info("GetMicDeviceCaps end", data);
        return JSON.stringify(data);
    }

    // 获取本地当前摄像头参数
    GetCameraDeviceSetting() {
        log.info("GetCameraDeviceSetting begin");
        var setting = this.libMediasoupClient.videoProducer.track.getSettings();
        const data = {
            aspectRatio: setting.aspectRatio,
            frameRate: Math.round(setting.frameRate),
            height: setting.height,
            width: setting.width,
        };
        this.camera_setting_ = data;
        this.camera_id_ = setting.deviceId;
        log.info("GetCameraDeviceSetting end", data);
        return JSON.stringify(data);
    }

    // 获取本地当前Mic参数
    GetMicDeviceSetting() {
        log.info("GetMicDeviceSetting begin");
        const setting = this.libMediasoupClient.audioProducer.track.getSettings();
        const data = {
            channelCount: setting.channelCount,
            sampleRate: setting.sampleRate,
            sampleSize: setting.sampleSize,
        };
        this.mic_id_ = setting.deviceId;
        this.mic_setting_ = data;
        log.info("GetMicDeviceSetting end", data);
        return JSON.stringify(data);
    }

    // 设置本地摄像头参数
    UpdateCameraDeviceSetting(
        width: number,
        height: number,
        framerate: number,
        bitrate: number
    ) {
        this.UpdateCameraDeviceSettingInternal(
            width,
            height,
            framerate,
            bitrate
        );
    }
    //更改当前摄像头视频流的分辨率和帧率，以及码率
    async UpdateCameraDeviceSettingInternal(
        width: number,
        height: number,
        framerate: number,
        bitrate: number
    ) {
        log.info("UpdateCameraDeviceSettingInternal begin");
        var video_cons: any = {};
        if (width != -1 && height != -1) {
            video_cons["width"] = width;
            video_cons["height"] = height;
        }
        if (framerate != -1) video_cons["frameRate"] = framerate;
        try {
            await this.libMediasoupClient.videoProducer.track.applyConstraints(
                video_cons
            );
            var setting = this.libMediasoupClient.videoProducer.track.getSettings();
            const data = {
                aspectRatio: setting.aspectRatio,
                frameRate: Math.round(setting.frameRate),
                height: setting.height,
                width: setting.width,
            };
            this.camera_setting_ = data;
            log.info("UpdateCameraDeviceSettingInternal end", data);
        } catch (error) {
            log.error("UpdateCameraDeviceSettingInternal", error);
        }
    }
}
