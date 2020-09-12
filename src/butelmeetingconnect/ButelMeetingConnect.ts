import EventEmitter from 'wolfy87-eventemitter'
import { MeetingConnect } from '../meetingconnect/MeetingConnect'

export class ButelMeetingConnect extends EventEmitter{
    MeetingConnect = new MeetingConnect();
    constructor() {
        super()
    }
}