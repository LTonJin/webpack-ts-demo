export const config = {
    version: "V1.2", // version
    hostname: "192.168.1.191",
    listenPort: "3000",
    nps_: "http://175.102.132.82:8018/nps_x1/",
    host_auth_: "",
    host_meeting_: "",
    AppKey_: "0ea8689329a446a5b67fc360ef195fc4",
    upgrade_server_: '',
    enable_remote_camera_default_: '',
    enable_camera_: '',
    enable_mic_: '',
    camera_quality_level_: 4,
    share_quality_level_default_: 2,
    auth: "https://brtc.butel.com:31001", // authenticate url
    meeting: "https://brtc.butel.com:31001", //meeting url
    login: "/BaikuUserCenterV2/auth",
    createMeeting: "/MeetingManage/callService",
};
export default config;
