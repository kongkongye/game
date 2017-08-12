window.Color = (function () {
    /**
     * 格式化
     * @param str 普通字符串
     * @return {Array} 格式化后的jquery包装对象列表
     */
    var format = function (str) {
        var result = [];

        new Splitor(str).split().forEach(function(e) {
            result.push(formatSingle(e['br'], e['str'], e['color']));
        });

        return result;
    };

    /**
     * 格式化单个字符串
     * @param br 是否是换行,true时下面两个参数都无效
     * @param str 普通字符串
     * @param color 颜色格式,如'#a#z'这样的(优化过的)
     * @return 格式化后的jquery包装对象
     */
    var formatSingle = function (br, str, color) {
        //换行
        if (br) return $('<br>');

        var ele = $('<span>'+str+'</span>');
        formatSingleDom(ele, color);
        return ele;
    };

    /**
     * 格式化单个字符串对象
     * @param ele jq包装对象(将在此对象上添加css效果)
     * @param color 颜色格式,如'#a#z'这样的(可以是未优化过的)
     */
    var formatSingleDom = function (ele, color) {
        //会先进行优化
        optimize(color).split(ColorConstant.CHAR).forEach(function(e) {
            if (e) {
                if (isColor(e)) {
                    ele.addClass('color-'+e);
                }else if (isFormat(e)) {
                    ele.addClass('format-'+e);
                }
            }
        });
    };

    /**
     * 优化颜色格式
     * 如'#a#b#z' -> '#b#z'
     * 如'#a#z#a' -> '#a'
     * @return {string} 优化后的
     */
    var optimize = function (color) {
        var chars = color.split('#').filter(function(e) {
            return !!e;
        }).join('');

        //获取最后一个颜色及其之后的
        for (var i=chars.length-1;i>=0;i--) {
            if (isColor(chars[i])) {
                chars = chars.substr(i);
                break;
            }
        }

        //去除重复格式
        var result = '';
        Common.getUniqueChars(chars).split('').forEach(function(e) {
            result += '#'+e;
        });
        return result;
    };

    /**
     * 获取开始的颜色字符(注意是开始的,而不是第一个找到的颜色字符)
     * @return 单个的颜色字符,如果无颜色返回null
     */
    var getLeadingColor = function(str) {
        if (str && str.length >= 2 && str.substr(0, 1) === ColorConstant.CHAR) {
            var char = str.substr(1, 1);
            if (isColor(char)) return char;
        }
        return null;
    };

    /**
     * 检测字符是否是颜色提示符(#)
     * @param {string} char 要检测的单个字符
     */
    var isChar = function (char) {
        return char === ColorConstant.CHAR;
    };

    /**
     * 检测字符是否是颜色(可能是保留的)
     * @param {string} char 要检测的单个字符
     */
    var isColor = function (char) {
        return char.length === 1 && ColorConstant.COLORS.indexOf(char) !== -1;
    };

    /**
     * 检测字符是否是格式(可能是保留的)
     * @param {string} char 要检测的单个字符
     */
    var isFormat = function (char) {
        return char.length === 1 && ColorConstant.FORMATS.indexOf(char) !== -1;
    };

    /**
     * 检测字符是否是换行
     */
    var isBr = function(char) {
        return char === ColorConstant.BR;
    };

    return {
        format: format,
        formatSingle: formatSingle,
        formatSingleDom: formatSingleDom,
        optimize: optimize,
        isChar: isChar,
        isColor: isColor,
        isFormat: isFormat,
        getLeadingColor: getLeadingColor,
        isBr: isBr,
    };
})();