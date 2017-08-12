window.PageParam = (function () {
    /**
     * 获取变量
     * @param path 页面路径
     * @return {Array} 全部变量(无重复)
     */
    var getParams = function (path) {
        //获取
        var result = getPage(path);
        //去重
        result = reduce(result);
        //返回
        return result;
    };

    var getPage = function (path) {
        var page = PageConfig.getPage(path).page;
        var result = [];
        //标题
        result = result.concat(get(page['_title']));
        //行列表
        page['lines'].forEach(function(e) {
            result = result.concat(getVirtualLine(e))
        });
        //返回
        return result;
    };

    var getVirtualLine = function (virtualLine) {
        var type = virtualLine['type'];
        if (type === 'line') {
            return getLine(virtualLine);
        }else if (type === 'list') {
            return getList(virtualLine);
        }else if (type === 'br') {
            return getBr(virtualLine);
        }else if (type === 'import') {
            return getImport(virtualLine);
        }else throw '虚拟行类型'+type+'未识别!';
    };

    var getLine = function (virtualLine) {
        var result = [];
        //条件
        result = result.concat(get(virtualLine['_con']));
        //组件
        virtualLine['components'].forEach(function(e) {
            result = result.concat(getComponent(e))
        });
        //返回
        return result;
    };

    var getList = function (virtualLine) {
        var result = [];
        //条件
        result = result.concat(get(virtualLine['_con']));
        //行列表
        virtualLine['lines'].forEach(function(e) {
            result = result.concat(getVirtualLine(e))
        });
        //返回
        return result;
    };

    var getBr = function (virtualLine) {
        var result = [];
        //条件
        result = result.concat(get(virtualLine['_con']));
        //返回
        return result;
    };

    var getImport = function (virtualLine) {
        var result = [];
        //导入
        result = result.concat(getPage(virtualLine['_path']));
        //返回
        return result;
    };

    var getComponent = function (component) {
        var type = component['type'];
        if (type === 'text') {
            return getText(component);
        }else if (type === 'button') {
            return getButton(component);
        }else if (type === 'input') {
            return getInput(component);
        }else if (type === 'container') {
            return getContainer(component);
        }else throw '组件类型'+type+'未识别!';
    };

    var getText = function (component) {
        var result = [];

        //条件
        result = result.concat(get(component['_con']));

        //内容
        result = result.concat(get(component['content']));

        //返回
        return result;
    };

    var getButton = function (component) {
        var result = [];

        //条件
        result = result.concat(get(component['_con']));

        //命令
        result = result.concat(get(component['_cmd']));

        //内容
        result = result.concat(get(component['content']));

        //返回
        return result;
    };

    var getInput = function (component) {
        var result = [];

        //条件
        result = result.concat(get(component['_con']));

        //默认值
        result = result.concat(get(component['_default']));

        //描述
        result = result.concat(get(component['_description']));

        //返回
        return result;
    };

    var getContainer = function (component) {
        var result = [];

        //条件
        result = result.concat(get(component['_con']));

        //组件
        component['components'].forEach(function(e) {
            result = result.concat(getComponent(e))
        });

        //返回
        return result;
    };

    /**
     * 获取包含的变量
     * @param {string|null} str 字符串
     * @return {Array} 变量列表,可为空数组不为null
     */
    var get = function (str) {
        if (!str) return [];

        return Param.getParams(str);
    };

    /**
     * 去重
     * @param array 数组
     * @return {Array} 去重后的新数组,不为null可为空数组
     */
    var reduce = function (array) {
        if (!array || array.length === 0) return [];

        //去重
        var set = {};
        array.forEach(function(e) {
            var key = e['type']+":"+e['name'];
            set[key] = e;
        });

        //构造结果
        var result = [];
        for (var key in set) {
            if (set.hasOwnProperty(key)) {
                result.push(set[key]);
            }
        }

        return result;
    };

    return {
        getParams: getParams
    };
})();