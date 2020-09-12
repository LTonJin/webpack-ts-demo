// Adds support for Promise to socket.io-client
exports.promise = function(socket:any) {
  return function request(type:string, data = {}) {
    return new Promise((resolve) => {
      socket.emit(type, data, resolve);
    });
  }
};
