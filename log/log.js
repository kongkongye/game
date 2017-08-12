/**
 * @param source 来源
 */
window.Logger = function (source) {
    let getTime = function () {
        return new Date().format("hh:mm:ss.S");
    };

    let debug = function (type, msg, ...args) {
        log(console.debug, '调试', '#8cb8e2', type, msg, args);
    };

    let info = function (type, msg, ...args) {
        log(console.info, '信息', '#07c3c3', type, msg, args);
    };

    let warn = function (type, msg, ...args) {
        log(console.warn, '警告', '#a2a212', type, msg, args);
    };

    let error = function (type, msg, ...args) {
        log(console.error, '错误', 'red', type, msg, args);
    };

    let log = (func, level, color, type, msg, args) => {
        args.splice(0, 0, msg);
        func("%c"+Common.convert('[{0}][{1}][{2}][{3}] {4}', getTime(), level, type, source, Common.convert.apply(null, args)), "color: "+color);
    };

    return {
        debug: debug,
        info: info,
        warn: warn,
        error: error,
    }
};

window.Log = new Logger("系统");