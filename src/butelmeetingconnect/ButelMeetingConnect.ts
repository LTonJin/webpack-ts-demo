import EventEmitter from "wolfy87-eventemitter";
import { MeetingConnect } from "../meetingconnect/MeetingConnect";
import { _ajax } from "../utils/ajax";
import { _objToParamAndSerialize } from "../utils/utils";
import { config } from "../config";
import { Logger } from "../utils/ButelLogger";
const log: any = new Logger("ButelMeetingConnect");

// const meetingConnect = new MeetingConnect();

export class ButelMeetingConnect extends EventEmitter {
    
    meetingConnect = new MeetingConnect();

    user_token_: string = "";
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
        this.meetingConnect.join_meeting(meetingId, "232323", "90898383", isSpeak, nickname).then(res => {
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
