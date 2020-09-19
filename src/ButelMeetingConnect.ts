import EventEmitter from "wolfy87-eventemitter";
import { MeetingConnect } from "./MeetingConnect";
import { _ajax } from "./utils/ajax";
import { _objToParamAndSerialize } from "./utils/utils";
import { config } from "./config";
import { Logger } from "./utils/ButelLogger";
const log: any = new Logger("ButelMeetingConnect");

// const meetingConnect = new MeetingConnect();
interface callbackObject {
    "OnStartSpeak": Function;
    "OnStopSpeak": Function;
    "OnMeetingEnd": Function;
    "OnKickout": Function;
    "OnUserJoin": Function;
    "OnUserLeave": Function;
    "OnUserOpenCamera": Function;
    "OnUserCloseCamera": Function;
    "OnUserOpenMic": Function;
    "OnUserCloseMic": Function;
    "OnUserOpenShare": Function;
    "OnUserCloseShare": Function;
    "OnUserVideoAngleChange": Function;//发言者视频画面角度变化通;
    "OnMeetingBreak": Function;//会议被中断通知，此时UI应该不允许做其他操;
    "OnMeetingRestore": Function;//会议中断恢复通知
    "OnMeetingDisConnect": Function;//会议网关的连接中断，只有在未参会时回调该接口
    "OnMeetingException": Function;//会议底层异常通知
    "OnMeetingQos": Function;//会议QOS信息通知，定时回调
    "OnMediaAdapterRequest": Function;//本地发言用户媒体流自适应调整通知
    "OnMeetingModeChange": Function;//会议模式被改变通知
    "OnHostControl": Function;//收到主持人远程控制摄像头和Mic的通知
    "OnRaiseHandEvent": Function;//主持人收到用户举手的通知
}

export class ButelMeetingConnect extends EventEmitter {
    
    meetingConnect = new MeetingConnect();

    user_token_: string = "";
    meetingCallback = {};
    constructor() {
        super();
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
        this.meetingConnect.init();
        this.meetingConnect.destroy();
    }

    // 设置回调
    SetCallback(callbackObject: callbackObject) {
        this.meetingCallback = callbackObject;
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
    JoinMeeting(meetingId: string, isSpeak: boolean, nickname: string, success: Function, error: Function) {
        this.meetingConnect.join_meeting(meetingId, "232323", "70827739", isSpeak, nickname).then(res => {
            // log.info('JoinMeeting success ', res);
            success(res);
        }).catch(err => {
            // log.info('JoinMeeting error ', err);
            error(err)
        })
    }

    // 取消发布
    unpublish() {
        this.meetingConnect.unpublish();
    }
}
