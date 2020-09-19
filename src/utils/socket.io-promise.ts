// Adds support for Promise to socket.io-client
import { Logger } from "./ButelLogger";
const log: any = new Logger("socket.io-promise");

exports.promise = function (socket: any) {
    return async function request(type: string, data = {}) {
        try {
            const res: string = await new Promise((resolve) => {
                socket.emit(type, JSON.stringify(data), resolve);
            });
            const parse = JSON.parse(res);
            log.info('向服务端发送请求成功：',type, parse);
            return parse;
        } catch (error) {
          log.error('向服务端发送请求出错：', type, error)
        }
    };
};

exports.response = function (socket: any) {
  return function response(type: string, fn: Function) {
    socket.on(type, (res?: string) => {
      log.info('收到服务器通知 ', type, res);
      if (res) {
        fn(JSON.parse(res));
      }
      else {
        fn();
      }

    })
  }
}