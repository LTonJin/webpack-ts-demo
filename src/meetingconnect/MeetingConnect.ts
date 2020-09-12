import EventEmitter from 'wolfy87-eventemitter'
import { Seesion } from '../Session/Session'
import { LibMediasoupClient } from '../libmediasoupclient/LibMediasoupClient'



export class MeetingConnect extends EventEmitter{
    LibMediasoupClient: any = new LibMediasoupClient();
    Seesion = new Seesion();
    constructor() {
        super()
    }
}