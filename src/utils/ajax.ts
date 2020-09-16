function _typeFactory(type: any) {
  return function (obj: any) {
    return Object.prototype.toString.call(obj) === "[object " + type + "]";
  };
}

var _isString = _typeFactory("String");
var _default_request_prop: any = {
  timeout: 30000,
  responseType: "json",
  withCredentials: false,
};

// declare var _ajax: (options: any) => any;

export function _ajax(options: any): any {
  var xhr: any = null,
    key;
  var method = options.method ? options.method.toLowerCase() : "get";

  if (window.XMLHttpRequest) {
    //code for IE7, Firefox, Opera, ect.
    xhr = new window.XMLHttpRequest();
  } else if (window.ActiveXObject) {
    //code for IE6, IE5
    xhr = new ActiveXObject("Microsoft.XMLHTTP");
  } else {
    throw new Error("Your browser does not support XMLHTTP.");
  }

  // request error callback handler for access control error
  xhr.onerror = function (evt: any) {
    options.error({ code: 99, desc: "access control error" }, "error");
  };

  // request done callback handler ,that is xhr.readyState is equal to 4
  xhr.onload = function () {
    if (xhr.status === 200) {
      if (options.success instanceof window.Function) {
        var dataObj = xhr.response;
        if (_isString(dataObj)) {
          try {
            dataObj = JSON.parse(dataObj);
          } catch (e) {}
        }
        options.success(dataObj, "success");
      }
    } else {
      if (options.error instanceof window.Function) {
        options.error({ code: xhr.status, desc: xhr.statusText }, "error");
      }
    }
  };

  // abort callback handler
  xhr.onabort = function () {
    if (options.error instanceof window.Function) {
      options.error({ code: 98, desc: "request aborted" }, "abort");
    }
  };

  // timeout callback handler
  xhr.ontimeout = function () {
    if (options.error instanceof window.Function) {
      options.error({ code: 408, desc: "request timeout" }, "timeout");
    }
  };

  xhr.open(method, options.url, true);

  //set request xhr property like timeout、withCredentials
  for (key in _default_request_prop) {
    if (options.hasOwnProperty(key)) {
      xhr[key] = options[key];
    } else {
      xhr[key] = _default_request_prop[key];
    }
  }

  //set request header if any
  if (options.headers) {
    for (key in options.headers) {
      xhr.setRequestHeader(key, options.headers[key]);
    }
  }

  //send xhr request
  switch (method) {
    case "get":
    case "delete":
      xhr.send();
      break;
    case "post":
    case "put":
      xhr.send(options.data ? window.JSON.stringify(options.data) : "");
      break;
  }
  return xhr;
}
export default _ajax;
