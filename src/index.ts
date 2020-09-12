
import { ButelMeetingConnect } from './butelmeetingconnect/ButelMeetingConnect'

import "@babel/polyfill";

function CreateInstance (){
    return new ButelMeetingConnect;
}
const _sdk = {
    "version": 'v1.1.0',
    "CreateInstance": CreateInstance,
};
// declare global {

//     interface Window {
//        xxx: object
//     }
//     }
export default _sdk;

// window["ButelRTCSDK"] = _sdk;
class Seesion{
    constructor() {
    }
}
new Seesion()