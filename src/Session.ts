import EventEmitter from "wolfy87-eventemitter";
import { config } from "./config";
import { Logger } from "./utils/ButelLogger";
const socketClient = require("socket.io-client");
const socketPromise = require("./utils/socket.io-promise").promise;
const socketResponse = require("./utils/socket.io-promise").response;
const log: any = new Logger("Session");

export class Session extends EventEmitter {
    socket: any;
    _isConnected: boolean = false;

    constructor() {
        super();
    }

    init() {
        log.info("初始化");
        if (!this._isConnected) {
            this.connect();
        } else {
            log.info("已经连接成功");
        }
        this.startListener();
    }
    destroy() {
        this.stopListener();
        this.socket.close()
    }
    

    async connect() {
        const opts = {
            path: "/BRTCGateway",
            transports: ["websocket"],
        };
        const serverUrl = `https://${config.hostname}:${config.listenPort}`;
        this.socket = socketClient(serverUrl, opts);
        console.log('socket', this.socket);
        
        this.socket.request = socketPromise(this.socket);
        this.socket.response = socketResponse(this.socket);
        this.socket.on("connect", async () => {
            this._isConnected = true;
            const data = {
                res: 1,
                desc: "connect",
            };
            this.emit("connect", data);
            log.info("socket连接成功");
        });
        this.socket.on("disconnect", () => {
            const data = {
                res: 0,
                desc: "disconnect",
            };
            this._isConnected = false;
            this.emit("connect", data);
            log.info("socket 断开连接");
        });

        this.socket.on("connect_error", (error: any) => {
            const data = {
                res: 0,
                desc: "connect_error",
            };
            this._isConnected = false;
            this.emit("connect", data);
            log.error(
                "could not connect to %s%s (%s)",
                serverUrl,
                opts.path,
                error.message
            );
        });
    }

    // 加入会议
    async join_meeting(
        userId: string,
        token: string,
        meetingId: string,
        isSpeak: boolean,
        nickName: string
    ) {
        return await this.socket.request("join_meeting", {userId, token, meetingId,isSpeak, nickName});
    }

    // 退出会议
    async exit_meeting() {
        return await this.socket.request("exit_meeting");
    }

    // 请求发言
    async ask_for_speak() {
        return await this.socket.request("ask_for_speak");
    }

    // 举手请求发言
    async raise_hand_for_speak() {
        return await this.socket.request("ask_for_speak");
    }

    // 请求停止发言
    async ask_for_stop_speak() {
        return await this.socket.request("ask_for_stop_speak");
    }

    // 连接produce
    async produce_connect(dtlsParameters: any) {
        return await this.socket.request("produce_connect", {dtlsParameters});
    }

    // 创建produce
    async produce( kind: string, rtpParameters:any, params: any) {
        return await this.socket.request("produce",  { kind, rtpParameters, params });
    }

    // 关闭produce
    async close_produce( kind: string) {
        return await this.socket.request("close_produce",  { kind });
    }

    // 连接consume
    async cosume_connect(dtlsParameters: any) {
        return await this.socket.request("cosume_connect", {dtlsParameters});
    }

    // 创建consume
    async consume(userId: string, kind: string, rtpCapabilities: any) {
        return await this.socket.request("consume", {userId, kind, rtpCapabilities });
    }

    // 关闭consume
    async close_consume( userId:string, kind: string) {
        return await this.socket.request("close_consume", { userId, kind });
    }

    // 启动consume
    async consume_resume(userId: string, kind: string) {
        return await this.socket.request("consume_resume", { userId, kind });
    }

    // 获取会议室所有成员
    async get_all_user() {
        return await this.socket.request("get_all_user");
    }

    // 发送UI信息
    async send_ui_message(userId:string, msgId: number, msgData: string) {
        return await this.socket.request("send_ui_message", {userId, msgId, msgData});
    }

    // 指定发言人
    async set_speaker(userId:string, cancelUserId: string) {
        return await this.socket.request("set_speaker", {userId, cancelUserId});
    }

    // 请出会议室
    async kick_out_user(userId:string) {
        return await this.socket.request("kick_out_user", {userId});
    }

/*******************************************************************************************/

    // 监听服务的事件
    startListener() {
        // 本端开始发言通知
        this.socket.response("start_speak_notify", () => {
            this.emit('start_speak_notify');
        });
        // 本端停止发言通知
        this.socket.response("stop_speak_notify", () => {
            this.emit('stop_speak_notify');
        });
        // 本端被踢下线通知
        this.socket.response("kick_out_notify", () => {
            this.emit('kick_out_notify');
        });
        // 议室成员加入通知
        this.socket.response("user_join_notify", (res: any) => {
            this.emit('user_join_notify', res);
        });
        // 会议室成员退出通知
        this.socket.response("user_leave_notify", (res: any) => {
            this.emit('user_leave_notify', res);
        });
        // 会议模式被改变通知
        this.socket.response("meeting_mode_change_notify", (res: any) => {
            this.emit('meeting_mode_change_notify', res);
        });
        // 收到主持人远程控制摄像头和Mic的通知
        this.socket.response("host_control_notify", (res: any) => {
            this.emit('host_control_notify', res);
        });
        // 主持人收到用户举手通知
        this.socket.response("raise_hand_notify", (res: any) => {
            this.emit('raise_hand_notify', res);
        });
        // 收到主持人被移交通知
        this.socket.response("host_transfer_notify", (res: any) => {
            this.emit('host_transfer_notify', res);
        });
        // 即时消息通知
        this.socket.response("recv_ui_msg_notify", (res: any) => {
            this.emit('recv_ui_msg_notify', res);
        });
        // 其他用户开始发言通知
        this.socket.response("user_start_speak_notify",(res: any) => {
            this.emit('user_start_speak_notify',res);
        });
        // 其他用户停止发言通知
        this.socket.response("user_stop_speak_notify",(res: any) => {
            this.emit('user_stop_speak_notify',res);
        });
        // 会议结束通知
        this.socket.response("meeting_end_notify",() => {
            this.emit('meeting_end_notify');
        });
        // 会议异常通知
        this.socket.response("meeting_exception_notify",() => {
            this.emit('meeting_exception_notify');
        });
        // 发言者发布视频通知
        this.socket.response("user_publish_video_notify",(res: any) => {
            this.emit('user_publish_video_notify',res);
        });
        // 发言者取消发布视频流通知
        this.socket.response("user_unpublish_video_notify",(res: any) => {
            this.emit('user_unpublish_video_notify',res);
        });
        // 发言者发布音频流通知
        this.socket.response("user_publish_audio_notify",(res: any) => {
            this.emit('user_publish_audio_notify',res);
        });
        // 发言者取消发布音频流通知
        this.socket.response("user_unpublish_audio_notify",(res: any) => {
            this.emit('user_unpublish_audio_notify',res);
        });
        // 发言者发布文档视频流通知
        this.socket.response("user_publish_share_notify",(res: any) => {
            this.emit('user_publish_share_notify',res);
        });
        // 发言者取消发布文档视频流通知
        this.socket.response("user_unpublish_share_notify",(res: any) => {
            this.emit('user_unpublish_share_notify',res);
        });
    }

    stopListener() {
        this.socket.removeEvent("connect");
        this.socket.removeEvent("start_speak_notify");
        this.socket.removeEvent("stop_speak_notify");
        this.socket.removeEvent("kick_out_notify");
        this.socket.removeEvent("user_join_notify");
        this.socket.removeEvent("user_leave_notify");
        this.socket.removeEvent("meeting_mode_change_notify");
        this.socket.removeEvent("host_control_notify");
        this.socket.removeEvent("raise_hand_notify");
        this.socket.removeEvent("host_transfer_notify");
        this.socket.removeEvent("recv_ui_msg_notify");
        this.socket.removeEvent("user_start_speak_notify");
        this.socket.removeEvent("user_stop_speak_notify");
        this.socket.removeEvent("meeting_end_notify");
        this.socket.removeEvent("meeting_exception_notify");
        this.socket.removeEvent("user_publish_video_notify");
        this.socket.removeEvent("user_unpublish_video_notify");
        this.socket.removeEvent("user_publish_audio_notify");
        this.socket.removeEvent("user_unpublish_audio_notify");
        this.socket.removeEvent("user_publish_share_notify");
        this.socket.removeEvent("user_unpublish_share_notify");
    }




    
}
