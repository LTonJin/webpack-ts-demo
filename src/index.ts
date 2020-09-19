import { ButelMeetingConnect } from "./ButelMeetingConnect";
import { config } from './config'

function CreateInstance() {
  return new ButelMeetingConnect();
}
const _sdk = {
  version: config.version,
  CreateInstance: CreateInstance,
};
declare global {
  interface Window {
    ButelRTCSDK: object;
    // ButelRTCSDKCallback: Function;
  }
}
export default _sdk;

window["ButelRTCSDK"] = _sdk;

// class ButelRTCSDKCallback {
// }
// window["ButelRTCSDKCallback"] = ButelRTCSDKCallback;
