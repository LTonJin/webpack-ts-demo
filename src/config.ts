export const config = {
    version: "V1.2", // version
    hostname: "192.168.1.192",
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

export function setConfig(configOption: any) {
    configOption.NPS && (config.nps_ = configOption.NPS);
    configOption.host_auth && (config.host_auth_ = configOption.host_auth);
    configOption.host_meeting && (config.host_meeting_ = configOption.host_meeting);
    configOption.AppKey && (config.AppKey_ = configOption.AppKey);
    configOption.UpgradeServer && (config.upgrade_server_ = configOption.UpgradeServer);
    configOption.EnableRemoteCamera && (config.enable_remote_camera_default_ = configOption.EnableRemoteCamera);
    configOption.EnableCamera && (config.enable_camera_ = configOption.EnableCamera);
    configOption.EnableMic && (config.enable_mic_ = configOption.EnableMic);
    configOption.CameraQualityLevel && (config.camera_quality_level_ = configOption.CameraQualityLevel);
    configOption.ShareQualityLevel && (config.share_quality_level_default_ = configOption.ShareQualityLevel);
}
