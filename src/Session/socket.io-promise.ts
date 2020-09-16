// Adds support for Promise to socket.io-client
import { Logger } from "../utils/ButelLogger";
const log: any = new Logger("socket.io-promise");

exports.promise = function (socket: any) {
    return async function request(type: string, data = {}) {
        try {
            const res: string = await new Promise((resolve) => {
                socket.emit(type, JSON.stringify(data), resolve);
            });
            return JSON.parse(res);
        } catch (error) {
          log.error('向服务端发送请求出错：', type, error)
        }
    };
};
