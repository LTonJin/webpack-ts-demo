import EventEmitter from "wolfy87-eventemitter";
import { MeetingConnect } from "./MeetingConnect";
import { _ajax } from "./utils/ajax";
import { _objToParamAndSerialize } from "./utils/utils";
import { config } from "./config";
import { Logger } from "./utils/ButelLogger";
import store from "./utils/store";
const log: any = new Logger("ButelMeetingConnect");

export class ButelMeetingConnect extends EventEmitter {
    meetingConnect = new MeetingConnect();

    user_id_: string = "";
    user_uid_: string = "";
    user_nickname_: string = "";
    user_token_: string = "";
    init_token_flag_: boolean = false;

    constructor() {
        super();
        this.meetingConnect.init();
        this.startListener();
    }

    // 初始化
    Init(userId: string, passwd: string, success: Function, error: Function) {
        const params = {
            userId: userId,
            passwd: passwd,
            success: success,
            error: error,
        };
        console.log(params);
        var paramObj = {
            params: {
                account: userId,
                password: passwd,
                //"appKey": "0ea8689329a446a5b67fc360ef195fc4",
                appKey: config.AppKey_,
                imei: "imei",
                productId: "all",
                deviceType: "IOS_KESHI",
                appType: "pc",
            },
            service: "authorize",
        };

        //meeting user login get token
        var url =
            config.host_auth_ + "auth?" + _objToParamAndSerialize(paramObj);
        _ajax({
            url: url,
            method: "post",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            success: (data: any) => {
                if (+data.status === 0) {
                    this.user_id_ = data["user"]["nubeNumber"]; //使用init返回的视讯号
                    store.user_id_ = this.user_id_;
                    this.user_token_ = data["user"]["accessToken"];
                    this.user_uid_ = data["user"]["uid"];
                    if (data["user"]["nickname"])
                        this.user_nickname_ = data["user"]["nickname"];
                    else this.user_nickname_ = "";
                    this.init_token_flag_ = true;

                    //会议鉴权接口调用成功，回调成功函数，进行下一步操作
                    success();
                } else if (+data.status === -79) {
                    error({ code: -999, desc: "service internal error" });
                } else if (+data.status === -1) {
                    error({ code: -3, desc: "param error" });
                } else {
                    error({ code: data.status, desc: data.message });
                }
            },
            error: function (err: any) {
                error(err);
            },
        });
    }

    destroy() {
        this.stopListener();
    }

    // 有token初始化
    InitWithToken(userid: string, token: string, success: any, error: any) {
        this.user_id_ = userid;
        store.user_id_ = userid;
        this.user_token_ = token;
        this.user_nickname_ = "";
    }

    // 创建会议
    CreateMeeting(
        meetingtype: string,
        topic: any,
        starttime: Date,
        endtime: Date,
        success_: Function,
        error_: Function
    ) {
        // createmeeting_success_fun = success_;
        // createmeeting_success_fun = error_;

        //http 接口
        var effectiveHour = 365 * 24; // offset one year
        var startDate = Math.floor(Date.now() / 1000);
        var endDateTime = startDate + effectiveHour * 60 * 60;
        var paramObj = {
            service: "CreateMeeting",
            params: {
                token: this.user_token_,
                meetingType: meetingtype, //1 即时会议 2 预约会议
                app: "JHY_MOBILE",
                topic: topic,
                //"invotedUsers": [{"phoneId":"63010051"}],
                invotedUsers: [],
                beginDateTime: "" + starttime,
                endDateTime: "" + endtime,
                speakersNum: 9, //最大发言者个数
            },
        };

        //https://218.80.0.211:31001/MeetingManage/callService?service=CreateMeeting&
        //params={"app":"JHY_MOBILE","topic":"陈世玉手机的预约会议","token":"0517780c-1fc0-4ba6-9ebf-e9b90a62115a"
        //,"meetingType":2,"invotedUsers":[{"phoneId":"63010051"}],"beginDateTime":"1563542040"}

        var createMeetingUrl =
            config.meeting +
            config.createMeeting +
            "?" +
            _objToParamAndSerialize(paramObj);
        // WriteLog(
        //   "[RTCMeetingSDK]CreateMeeting createMeetingUrl:" + createMeetingUrl
        // );
        _ajax({
            url: createMeetingUrl,
            method: "post",
            success: function (data: any) {
                if (data["result"]["rc"] === 0) {
                    var meetingId = data["response"]["meetingId"];
                    success_(meetingId);
                } else if (data["result"]["rc"] === -999) {
                    error_({ code: -999, desc: "service internal error" });
                } else if (
                    +data["result"]["rc"] === -903 ||
                    +data["result"]["rc"] === -902 ||
                    +data["result"]["rc"] === -923
                ) {
                    error_({
                        code: -2,
                        desc: "ticket invalid " + data["result"]["rc"],
                    });
                } else {
                    error_({ code: data.status, desc: data.message });
                }
            },
            error: function (err: any) {
                // WriteLog("[RTCMeeting]CreateMeeting" + JSON.stringify(err));
                error_(err);
            },
        });
    }
    // 加入会议
    JoinMeeting(
        meetingId: string,
        isSpeak: boolean,
        nickname: string,
        success: Function,
        error: Function
    ) {
        this.meetingConnect
            .join_meeting("62000334", "token", meetingId, isSpeak, nickname)
            .then((res) => {
                log.info("JoinMeeting success ", res);
                success(res);
            })
            .catch((err) => {
                log.info("JoinMeeting error ", err);
                error(err);
            });
    }
    GetMediaDevices(success: any, error: any) {
        this.meetingConnect.GetMediaDevices().then(
            (res) => {
                console.log(res);
                success(res);
            },
            (err) => {
                console.log(err);
                error(err);
            }
        );
    }

    startListener() {
        this.meetingConnect.on("onMediaAdapterRequest", (data: any) => {
            this.emit("onMediaAdapterRequest", data);
            log.info("onMediaAdapterRequest", data);
        });
        this.meetingConnect.on("onRemoteSpeakerForMaxVol", (data: any) => {
            this.emit("onRemoteSpeakerForMaxVol", data);
            log.info("onRemoteSpeakerForMaxVol", data);
        });
    }
    stopListener() {
        this.meetingConnect.removeEvent("onMediaAdapterRequest");
        this.meetingConnect.removeEvent("onRemoteSpeakerForMaxVol");
    }

    // 设置配置参数接口
    setConfig(configOption: any) {
        configOption.NPS && (config.nps_ = configOption.NPS);
        configOption.host_auth && (config.host_auth_ = configOption.host_auth);
        configOption.host_meeting &&
            (config.host_meeting_ = configOption.host_meeting);
        configOption.AppKey && (config.AppKey_ = configOption.AppKey);
        configOption.UpgradeServer &&
            (config.upgrade_server_ = configOption.UpgradeServer);
        configOption.EnableRemoteCamera &&
            (config.enable_remote_camera_default_ =
                configOption.EnableRemoteCamera);
        configOption.EnableCamera &&
            (config.enable_camera_ = configOption.EnableCamera);
        configOption.EnableMic && (config.enable_mic_ = configOption.EnableMic);
        configOption.CameraQualityLevel &&
            (config.camera_quality_level_ = configOption.CameraQualityLevel);
        configOption.ShareQualityLevel &&
            (config.share_quality_level_default_ =
                configOption.ShareQualityLevel);
    }
}
