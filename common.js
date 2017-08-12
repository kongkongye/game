// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

$.whenall = function(arr) {
    return $.when.apply($, arr);
};

window.Common = (function () {
    //'key Debouncer'的映射
    var debounces = {};

    /**
     * 字符串去重复字符
     * @return {string} 去除重复字符后的字符串
     */
    var getUniqueChars = function(str) {
        var unique = '';
        for (var i = 0; i < str.length; i++) {
            if (str.lastIndexOf(str[i]) === str.indexOf(str[i])) {
                unique += str[i];
            }
        }
        return unique;
    };

    /**
     * 获取随机id
     * @param length id长度
     */
    var getRandomId = function (length) {
        var text = "";
        var possible = "abcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    };

    /**
     * 获取随机long值
     * @return {number}
     */
    var getRandomLong = function () {
        return Math.floor(100000000 + Math.random() * 900000000);
    };

    /**
     * 获取最大页面数
     * @param total 总数,<=0时返回0
     * @param pageSize 分页大小,<=0时返回0
     * @return {int} 最大页面数,>=1,无元素时返回0
     */
    var getMaxPage = function (total, pageSize) {
        if (total <= 0 || pageSize <= 0) return 0;
        if (total%pageSize === 0) return parseInt(total/pageSize);
        return parseInt(total/pageSize+1);
    };

    /**
     * 分割字符串
     * 如str为'a b c',separator为' ',max为2,则结果为['a', 'b c']
     */
    var split = function (str, separator, max) {
        var arr = str.split(separator);
        var result = arr.splice(0, max-1);
        result.push(arr.join(separator));
        return result;
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    var Debouncer = function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };

    var debounce = function(key, func, wait, immediate) {
        var debouncer = debounces[key];
        if (!debouncer) {
            debouncer = Debouncer(func, wait, immediate);
            debounces[key] = debouncer;
        }
        debouncer();
    };

    /**
     * 转换变量
     * @param {string} content 可以包含变量{0},{1}...
     * @param args 变量列表,可选,默认无(因为es5不支持...的关系,定义中没写,但实际是有用的)
     * @return {string} 转换后的值
     */
    var convert = function(content) {
        for (var i=1;i<arguments.length;i++) {
            content = content.replace('{'+(i-1)+'}', arguments[i]);
        }
        return content;
    };

    return {
        getUniqueChars: getUniqueChars,
        getRandomId: getRandomId,
        getRandomLong: getRandomLong,
        getMaxPage: getMaxPage,
        split: split,
        Debouncer: Debouncer,
        debounce: debounce,
        convert: convert,
    };
})();