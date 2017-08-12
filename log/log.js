/**
 * @param source 来源
 */
window.Logger = function (source) {
    var getTime = function () {
        return new Date().format("hh:mm:ss.S");
    };

    var debug = function (type, msg) {
        var args = [];
        for (var i=2;i<arguments.length;i++) {
            args.push(arguments[i]);
        }

        log(console.debug, '调试', '#8cb8e2', type, msg, args);
    };

    var info = function (type, msg) {
        var args = [];
        for (var i=2;i<arguments.length;i++) {
            args.push(arguments[i]);
        }

        log(console.info, '信息', '#07c3c3', type, msg, args);
    };

    var warn = function (type, msg) {
        var args = [];
        for (var i=2;i<arguments.length;i++) {
            args.push(arguments[i]);
        }

        log(console.warn, '警告', '#a2a212', type, msg, args);
    };

    var error = function (type, msg) {var args = [];
        for (var i=2;i<arguments.length;i++) {
            args.push(arguments[i]);
        }

        log(console.error, '错误', 'red', type, msg, args);
    };

    var log = function(func, level, color, type, msg, args) {
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