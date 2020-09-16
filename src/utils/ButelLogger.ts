/**
 * ButelLogger
 */
//writeLevel总级别
var ButelLogger_writeLevel = 4;
//printLevel总级别
var ButelLogger_printLevel = 4;

//utils
function isTrue(v: boolean) {
  return v === true;
}

function isFalse(v: boolean) {
  return v === false;
}
function isUndef(v: any) {
  return v === undefined || v === null;
}

var NativeLog = null;

/**
 *
 * @param {*} moduleName 模块名
 * @param {*} printLevel 打印等级 默认为 4
 * @param {*} writeLevel 写文件等级 默认为 4
 */

// function Logger(moduleName: string, printLevel: number, writeLevel: number) {
//   this.moduleName = isUndef(moduleName) ? "butelLogger" : moduleName;
//   this.printLevel = isUndef(printLevel) ? 4 : printLevel;
//   this.writeLevel = isUndef(writeLevel) ? 4 : writeLevel;
// }
export class Logger {
  moduleName: string;
  printLevel: number;
  writeLevel: number;
  constructor(moduleName: string, printLevel: number = 4, writeLevel: number = 4) {
    this.moduleName = isUndef(moduleName) ? "butelLogger" : moduleName;
    this.printLevel = isUndef(printLevel) ? 4 : printLevel;
    this.writeLevel = isUndef(writeLevel) ? 4 : writeLevel;
  }
}

/**
 * @description 错误
 */
const proto:any = Logger.prototype;
proto.error = function () {
  var args = Array.prototype.slice.call(arguments, 0);

  args.unshift("【" + this.moduleName + "】");
  args.unshift("【" + new Date().toLocaleString() + "】");

  var message = "";
  for (let msg of args) {
    message +=
      " <---> " + (typeof msg === "object" ? JSON.stringify(msg) : msg);
  }

  if (ButelLogger_printLevel) {
    window.console.error(message);
  }

//   if (ButelLogger_writeLevel) {
//     if (window["meetingSDKInstance"]) {
//       window["meetingSDKInstance"].WriteLog(`[JavaScript] ${message}`);
//     }
//   }
};

/**
 * @description 警告
 */
proto.warn = function () {
  var args = Array.prototype.slice.call(arguments, 0);

  args.unshift("【" + this.moduleName + "】");
  args.unshift("【" + new Date().toLocaleString() + "】");

  var message = "";
  for (let msg of args) {
    message +=
      " <---> " + (typeof msg === "object" ? JSON.stringify(msg) : msg);
  }

  if (ButelLogger_printLevel > 1 && this.printLevel > 1) {
    window.console.warn(message);
  }

//   if (ButelLogger_writeLevel > 1) {
//     if (window["meetingSDKInstance"]) {
//       window["meetingSDKInstance"].WriteLog(`[JavaScript] ${message}`);
//     }
//   }
};

/**
 * @description 信息
 */
proto.info = function () {
  var args = Array.prototype.slice.call(arguments, 0);

  args.unshift("【" + this.moduleName + "】");
  args.unshift("【" + new Date().toLocaleString() + "】");

  var message = "";
  for (let msg of args) {
    message += typeof msg === "object" ? JSON.stringify(msg) : msg;
  }

  if (ButelLogger_printLevel > 2 && this.printLevel > 2) {
    window.console.info(message);
  }

//   if (ButelLogger_writeLevel > 2) {
//     if (window["meetingSDKInstance"]) {
//       window["meetingSDKInstance"].WriteLog(`[JavaScript] ${message}`);
//     }
//   }
};

/**
 * @description 一般
 */
proto.log = function () {
  var args = Array.prototype.slice.call(arguments, 0);
  args.unshift("【" + this.moduleName + "】");
  args.unshift("【" + new Date().toLocaleString() + "】");
  var message = "";
  for (let msg of args) {
    message +=
      " <---> " + (typeof msg === "object" ? JSON.stringify(msg) : msg);
  }

  if (ButelLogger_printLevel > 3 && this.printLevel > 3) {
    window.console.log(message);
  }

//   if (ButelLogger_writeLevel > 3) {
//     if (window["meetingSDKInstance"]) {
//       window["meetingSDKInstance"].WriteLog(`[JavaScript] ${message}`);
//     }
//   }
};

