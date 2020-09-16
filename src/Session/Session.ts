import EventEmitter from "wolfy87-eventemitter";
import { config } from "../config";
import { Logger } from "../utils/ButelLogger";
const socketClient = require("socket.io-client");
const socketPromise = require("./socket.io-promise").promise;
const log: any = new Logger("Session");

export class Seesion extends EventEmitter {
    socket: any;
    _isConnected: boolean = false;

    constructor() {
        super();
    }

    init() {
        log.info("初始化");
        this.startListener();
        if (!this._isConnected) {
            this.connect();
        } else {
            log.info("已经连接成功");
        }
    }
    destroy() {
        this.stopListener();
    }
    startListener() {}
    stopListener() {}

    async connect() {
        const opts = {
            path: "/BRTCGateway",
            transports: ["websocket"],
        };
        const serverUrl = `https://${config.hostname}:${config.listenPort}`;
        this.socket = socketClient(serverUrl, opts);
        this.socket.request = socketPromise(this.socket);
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
        isSpeak: number,
        nickName: string
    ) {
        const params = {
            userId: userId,
            token: token,
            meetingId: meetingId,
            isSpeak: isSpeak,
            nickName: nickName,
        };
        return await this.socket.request("join_meeting", params);
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

    // 连接produce
    async produce_connect(dtlsParameters: any) {
        await this.socket.request("produce_connect", dtlsParameters);
    }

    // 创建produce
    async produce( {transportId, kind, rtpParameters}: any) {
        await this.socket.request("produce",  { transportId,kind, rtpParameters});
    }

    // 关闭produce
    async close_produce( kind: string) {
        await this.socket.request("close_produce",  { kind });
    }

    // 连接consume
    async cosume_connect(dtlsParameters: any) {
        await this.socket.request("cosume_connect", dtlsParameters);
    }

    // 连接consume
    async cosume({rtpCapabilities, participantsID, consumerTransportID}: any) {
        await this.socket.request("cosume", {rtpCapabilities, participantsID, consumerTransportID});
    }
}
