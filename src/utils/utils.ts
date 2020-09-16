
export function _objToParamAndSerialize(obj: any) {
    var param = "", key;
    if (obj instanceof Object) {
        for (key in obj) {
            if (obj[key] instanceof Object) {
                param += key + "=" + window.JSON.stringify(obj[key]) + "&";
            } else {
                param += key + "=" + obj[key] + "&";
            }
        }
        return param.replace(/&$/, "")
    }
    return obj;
}