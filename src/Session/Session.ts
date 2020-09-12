import EventEmitter from 'wolfy87-eventemitter'
const socketClient = require('socket.io-client');
const socketPromise = require('./socket.io-promise').promise;
console.log('socketClient', socketClient);
console.log('socketPromise', socketPromise);
export class Seesion extends EventEmitter{
    constructor() {
        super()
    }
}
