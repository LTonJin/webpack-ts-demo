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


    // 远程发言折mic音量信息
    remote_audioContext_: any = {};
    remote_mediaStreamSource_: any = {};
    remote_scriptProcessor_: any = {};
    //远端发言者音量值
    remote_mic_vol_: any = {};

    max_vol_remote_speaker_id_: any;

    //本地mic音量监控
    audioContext_: any;
    mediaStreamSource_: any;
    scriptProcessor_: any;
    //本地mic音量值
    local_mic_vol_ = 0; //0-100

    //默认摄像头视频质量档位
    camera_quality_level_default_ = 4;
    //默认共享视频质量档位
    share_quality_level_default_ = 2;

    //摄像头视频质量档位
    camera_quality_level_ = this.camera_quality_level_default_;
    //共享视频质量档位
    share_quality_level_ = this.share_quality_level_default_;

    //视频参数
    video_width_:any;
    video_height_:any;
    video_framerate_:any;

    //视频流码率
    video_bitrate_default_ = 600;
    video_bitrate_max_ = 600;
    video_bitrate_min_ = 600;
    video_bitrate_ = this.video_bitrate_default_;

    //屏幕共享视频流码率
    data_bitrate_default_ = 1200;
    data_bitrate_max_ = 1200;
    data_bitrate_min_ = 1200;
    data_bitrate_ = this.data_bitrate_default_;

    //屏幕共享视频流的帧率
    data_framerate_ = 25;



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
        this.session.on("start_speak_notify", async () => {
            console.log("start_speak_notify");
            const stream = await this.libMediasoupClient.getUserMedia("video", {
                video: true,
                audio: true,
            });
            await this.libMediasoupClient.publish("video", stream);
            this.StartLocalMicVolMonitor();
        });

        // 本端停止发言通知
        this.session.on("stop_speak_notify", async () => {
            console.log("stop_speak_notify");
            await this.libMediasoupClient.unpublish();
            this.StopLocalMicVolMonitor();
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
        this.session.on("user_publish_audio_notify", async (data: any) => {
            console.log(data, "user_publish_audio_notify");
            await this.libMediasoupClient.subscribe(data.userId, "video");
            this.StartRemoteVolMonitor(data.userId);
        });

        // 发言者取消发布音频流通知
        this.session.on("user_unpublish_audio_notify", async (data: any) => {
            console.log(data, "user_unpublish_audio_notify");
            await this.libMediasoupClient.unsubscribe(data.userId, "audio");
            this.StopRemoteVolMonitor(data.userId);
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
        const stream = await this.libMediasoupClient.getUserMedia("video", {
            video: true,
            audio: true,
        });
        await this.libMediasoupClient.publish("video", stream);
        //显示video对象
        var user_local_video_ = this.libMediasoupClient.localMediaStream.get(
            "dom"
        );
        user_local_video_.srcObject = stream;

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
            if (bitrate < 0) {
                this.video_bitrate_ = this.video_bitrate_default_;
                this.UpdateVideoBitrate(this.video_bitrate_default_);
            } else {
                this.video_bitrate_ = bitrate;
                this.UpdateVideoBitrate(bitrate);
            }

            // 回调页面，通知码率变化
            var pd: any = {};
            pd.restype = 1;
            pd.bitrate = this.video_bitrate_;
            pd.framerate = framerate;
            pd.width = width;
            pd.height = height;
            pd.bitrate_default = this.video_bitrate_default_;
            this.emit("onMediaAdapterRequest", pd);
            log.info("UpdateCameraDeviceSettingInternal end", data);
        } catch (error) {
            log.error("UpdateCameraDeviceSettingInternal", error);
        }
    }

    // 动态更新本地摄像头视频流的码率
    async UpdateVideoBitrate(bitrate: any) {
        const parameters = this.libMediasoupClient.sendTransport.getParameters();
        if (!parameters.encodings) {
            parameters.encodings = [{}];
        }
        if (bitrate === "-1") {
            delete parameters.encodings[0].maxBitrate;
        } else {
            parameters.encodings[0].maxBitrate = bitrate * 1000;
        }
        try {
            await this.libMediasoupClient.sendTransport.setParameters();
            log.info("set bitrate ", bitrate);
        } catch (error) {
            log.error("set bitrate ", error);
        }
    }

    // 设置本地麦克风参数
    async UpdateMicDeviceSetting(new_seeting: any) {
        log.info("UpdateMicDeviceSetting", new_seeting);
        const track = this.libMediasoupClient.audioProducer.track;
        await track.applyConstraints(new_seeting);
        var setting = track.getSettings();
        this.mic_setting_ = {
            channelCount: setting.channelCount,
            sampleRate: setting.sampleRate,
            sampleSize: setting.sampleSize,
        };
        log.info("UpdateMicDeviceSetting", setting);
        // this.libMediasoupClient.localMediaStream
        //     .get("stream")
        //     .getAudioTracks()
        //     .forEach(async (track: any) => {
        //         await track.applyConstraints(JSON.parse(new_seeting))
        //         var setting = track.getSettings();
        //         this.mic_setting_ = {
        //             channelCount: setting.channelCount,
        //             sampleRate: setting.sampleRate,
        //             sampleSize: setting.sampleSize,
        //         };
        //     });
    }

    // 启用/关闭本地摄像头
    async EnableCamera(enabled: any) {
        if (enabled === 0) {
            await this.libMediasoupClient.unpublish("video");
        } else {
            const stream = await this.libMediasoupClient.getUserMedia("video", {
                video: true,
            });
            await this.libMediasoupClient.publish("video", stream);
        }
    }

    // 启用/关闭本地麦克风
    async EnableMic(enabled: any) {
        if (enabled === 0) {
            await this.libMediasoupClient.unpublish("audio");
        } else {
            const stream = await this.libMediasoupClient.getUserMedia("audio", {
                audio: true,
            });
            await this.libMediasoupClient.publish("audio", stream);
        }
    }

    // 启动本地屏幕窗口共享
    async StartScreenShare() {
        const stream = await this.libMediasoupClient.getUserMedia("share", {
            video: true,
        });
        await this.libMediasoupClient.publish("share", stream);
    }

    // 停止本地屏幕窗口共享
    async StopScreenShare() {
        await this.libMediasoupClient.unpublish("share");
    }

    // 获取本地发言者Mic音量值
    async GetLocalMicVol() {
        return this.local_mic_vol_;
    }
    //创建本地mic音量监控对象
    StartLocalMicVolMonitor() {
        log.info("StartLocalMicVolMonitor");
        this.audioContext_ = new AudioContext();
        try {
            // 将麦克风的声音输入这个对象
            this.mediaStreamSource_ = this.audioContext_.createMediaStreamSource(
                this.libMediasoupClient.localMediaStream
                    .get("stream")
                    .get("audio")
            );

            // 创建一个音频分析对象，采样的缓冲区大小为4096，输入和输出都是单声道
            this.scriptProcessor_ = this.audioContext_.createScriptProcessor(
                8192,
                2,
                2
            );

            // 将该分析对象与麦克风音频进行连接
            this.mediaStreamSource_.connect(this.scriptProcessor_);

            // 此举无甚效果，仅仅是因为解决 Chrome 自身的 bug
            this.scriptProcessor_.connect(this.audioContext_.destination);

            // 开始处理音频
            this.scriptProcessor_.onaudioprocess = (e: any) => {
                // 获得缓冲区的输入音频，转换为包含了PCM通道数据的32位浮点数组
                let buffer = e.inputBuffer.getChannelData(0);
                // 获取缓冲区中最大的音量值
                let maxVal = Math.max.apply(Math, buffer);
                this.local_mic_vol_ = Math.round(maxVal * 100);
                // 显示音量值
                log.log("local mic vol: ", this.local_mic_vol_);
            };
        } catch (err) {
            //在错误发生时怎么处理
            log.error("StartLocalMicVolMonitor ", err.name, err.message);
            if (this.scriptProcessor_) this.scriptProcessor_.disconnect();
            if (this.mediaStreamSource_) this.mediaStreamSource_.disconnect();
            if (this.audioContext_) this.audioContext_.close();

            this.audioContext_ = null;
            this.mediaStreamSource_ = null;
            this.scriptProcessor_ = null;
        }
    }
    StopLocalMicVolMonitor() {
        log.info("StopLocalMicVolMonitor");

        if (this.scriptProcessor_) this.scriptProcessor_.disconnect();
        if (this.mediaStreamSource_) this.mediaStreamSource_.disconnect();
        if (this.audioContext_) this.audioContext_.close();

        this.audioContext_ = null;
        this.mediaStreamSource_ = null;
        this.scriptProcessor_ = null;
    }

    // 获取远端发言者Mic音量值
    async GetRemoteMicVol(userId: string) {
        const vol = this.remote_mic_vol_[userId];
        if (vol) return vol;
        return 0;
    }

    //创建Remote发言者的音量监控对象
    StartRemoteVolMonitor(userid: string) {
        log.info("StartRemoteVolMonitor userid=", userid);
        const userInfo = this.libMediasoupClient.consumerList.get(userid);
        if (!userInfo) return;

        var ac = new AudioContext();
        this.remote_audioContext_[userid] = ac;

        // 将麦克风的声音输入这个对象
        var ms = ac.createMediaStreamSource(
            userInfo.get("consumer").get("audio")
        );
        this.remote_mediaStreamSource_[userid] = ms;

        // 创建一个音频分析对象，采样的缓冲区大小为4096，输入和输出都是单声道
        var sp = ac.createScriptProcessor(8192, 2, 2);
        this.remote_scriptProcessor_[userid] = sp;

        // 将该分析对象与麦克风音频进行连接
        ms.connect(sp);

        // 此举无甚效果，仅仅是因为解决 Chrome 自身的 bug
        sp.connect(ac.destination);

        // 开始处理音频
        sp.onaudioprocess = (e) => {
            // 获得缓冲区的输入音频，转换为包含了PCM通道数据的32位浮点数组
            let buffer: any = e.inputBuffer.getChannelData(0);
            // 获取缓冲区中最大的音量值
            let maxVal = Math.max.apply(Math, buffer);
            this.remote_mic_vol_[userid] = Math.round(maxVal * 100);
            // 显示音量值
            log.info(
                "remote userid: ",
                userid,
                " vol: ",
                this.remote_mic_vol_[userid]
            );

            //计算当前发言音量最大的发言者
            var max_vol = 0;
            var max_userid;
            Object.keys(this.remote_mic_vol_).forEach((key) => {
                if (this.remote_mic_vol_[key] > max_vol) {
                    max_vol = this.remote_mic_vol_[key];
                    max_userid = key;
                }
            });
            if (
                max_userid != undefined &&
                max_userid != this.max_vol_remote_speaker_id_
            ) {
                this.max_vol_remote_speaker_id_ = max_userid;

                var pd: any = {};
                pd.userid = max_userid;
                pd.vol = max_vol;
                this.emit("onRemoteSpeakerForMaxVol", pd);
            }
        };
    }
    StopRemoteVolMonitor(userid: string) {
        log.info("StopRemoteVolMonitor userid= ", userid);

        if (this.remote_scriptProcessor_[userid])
            this.remote_scriptProcessor_[userid].disconnect();
        if (this.remote_mediaStreamSource_[userid])
            this.remote_mediaStreamSource_[userid].disconnect();
        if (this.remote_audioContext_[userid])
            this.remote_audioContext_[userid].close();

        this.remote_audioContext_[userid] = null;
        this.remote_mediaStreamSource_[userid] = null;
        this.remote_scriptProcessor_[userid] = null;
    }

    // 更改本地使用的摄像头
    async UpdateLocalCamera(cameraid: any) {
        await this.libMediasoupClient.unpublish("video");
        var constraints: any = {};
        if (cameraid == "-1") constraints["video"] = true;
        else constraints["video"] = { deviceId: { exact: cameraid } };

        // if (this.mic_id_ != "")
        //     constraints["audio"] = { deviceId: { exact: this.mic_id_ } };
        // else constraints["audio"] = true;
        const stream = await this.libMediasoupClient.getUserMedia(
            "video",
            constraints
        );
        await this.libMediasoupClient.publish("video", stream);
    }

    // 更改本地使用的Mic
    async UpdateLocalMic(micid: any) {
        await this.libMediasoupClient.unpublish("audio");
        var constraints: any = {};

        if (micid == "-1") constraints["audio"] = true;
        else constraints["audio"] = { deviceId: { exact: micid } };

        // if (this.camera_id_ != "")
        //     constraints["video"] = { deviceId: { exact: this.camera_id_ } };

        const stream = await this.libMediasoupClient.getUserMedia(
            "audio",
            constraints
        );
        await this.libMediasoupClient.publish("audio", stream);
    }

    // 设置摄像头视频质量档位
    SetCameraVideoQuality(level: number) {}
    SetCameraVideoQualityInternal(level: number) {
        /*
			level为视频质量参数，定义如下：
				1：超清		1080P(1920x1080)	25fps	2Mbps
				2：高清		720P(1280x720)		25fps 	1.2Mbps
				3：标清		VGA(640x360)		15fps	300Kbps//2020-3-9改，原来600
							若摄像头不支持360分辨率，则改为640x480
				4：流畅		144P(192x144)		15fps	150kbps
				不设置的话，默认为流畅质量。
			*/
        log.info("SetCameraVideoQualityInternal ", level);

        level = Number(level);
        var h, w, fps, bitrate;
        switch (level) {
            case 1:
                w = 1920;
                h = 1080;
                fps = 25;
                bitrate = 2000;
                break;
            case 2:
                w = 1280;
                h = 720;
                fps = 25;
                bitrate = 1200;
                break;
            case 3:
                w = 640;
                h = 360;
                fps = 15;
                bitrate = 300;
                break;
            case 4:
                w = 192;
                h = 144;
                fps = 15;
                bitrate = 150;
                break;
            default:
                //缺省为流畅质量-4
                level = 4;
                w = 192;
                h = 144;
                fps = 15;
                bitrate = 150;
                break;
        }

        this.camera_quality_level_ = level;

        //检查档位参数是否超出当前使用的摄像头能力范围
        if (w > this.camera_caps_.width.max) {
            w = this.camera_caps_.width.max;
            if (w >= 1280) {
                w = 1280;
                h = 720;
            } else if (w >= 640) {
                w = 640;
                h = 360;
            } else {
                w = 192;
                h = 144;
            }

            if (h > this.camera_caps_.height.max) {
                h = this.camera_caps_.height.max;
            }
        }

        this.SetCameraParams(w, h, fps, bitrate);

        //更新摄像头视频流参数
        this.UpdateCameraDeviceSettingInternal(w, h, fps, bitrate);

        this.camera_setting_.width = w;
        this.camera_setting_.height = h;
        this.camera_setting_.frameRate = fps;

        return 1; //设置成功
    }
    SetCameraParams(width:any, height:any, framerate:any, bitrate:any) {
        log.info(
            "SetCameraParams" +
                " width=" +
                width +
                " height=" +
                height +
                " framerate=" +
                framerate +
                " bitrate=" +
                bitrate
        );

        this.video_width_ = width;
        this.video_height_ = height;
        this.video_framerate_ = framerate;

        //设置码率
        this.video_bitrate_default_ = bitrate;
        this.video_bitrate_ = this.video_bitrate_default_;
        this.video_bitrate_max_ = this.video_bitrate_default_;
        this.video_bitrate_min_ = this.video_bitrate_default_;
    }
}
