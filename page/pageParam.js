window.PageParam = (function () {
    /**
     * 获取变量
     * @param path 页面路径
     * @return {Array} 全部变量(无重复)
     */
    let getParams = function (path) {
        //获取
        let result = getPage(path);
        //去重
        result = reduce(result);
        //返回
        return result;
    };

    let getPage = function (path) {
        let page = PageConfig.getPage(path).page;
        let result = [];
        //标题
        result = result.concat(get(page['_title']));
        //行列表
        page['lines'].forEach(e => result = result.concat(getVirtualLine(e)));
        //返回
        return result;
    };

    let getVirtualLine = function (virtualLine) {
        let type = virtualLine['type'];
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

    let getLine = function (virtualLine) {
        let result = [];
        //条件
        result = result.concat(get(virtualLine['_con']));
        //组件
        virtualLine['components'].forEach(e => result = result.concat(getComponent(e)));
        //返回
        return result;
    };

    let getList = function (virtualLine) {
        let result = [];
        //条件
        result = result.concat(get(virtualLine['_con']));
        //行列表
        virtualLine['lines'].forEach(e => result = result.concat(getVirtualLine(e)));
        //返回
        return result;
    };

    let getBr = function (virtualLine) {
        let result = [];
        //条件
        result = result.concat(get(virtualLine['_con']));
        //返回
        return result;
    };

    let getImport = function (virtualLine) {
        let result = [];
        //导入
        result = result.concat(getPage(virtualLine['_path']));
        //返回
        return result;
    };

    let getComponent = function (component) {
        let type = component['type'];
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

    let getText = function (component) {
        let result = [];

        //条件
        result = result.concat(get(component['_con']));

        //内容
        result = result.concat(get(component['content']));

        //返回
        return result;
    };

    let getButton = function (component) {
        let result = [];

        //条件
        result = result.concat(get(component['_con']));

        //命令
        result = result.concat(get(component['_cmd']));

        //内容
        result = result.concat(get(component['content']));

        //返回
        return result;
    };

    let getInput = function (component) {
        let result = [];

        //条件
        result = result.concat(get(component['_con']));

        //默认值
        result = result.concat(get(component['_default']));

        //描述
        result = result.concat(get(component['_description']));

        //返回
        return result;
    };

    let getContainer = function (component) {
        let result = [];

        //条件
        result = result.concat(get(component['_con']));

        //组件
        component['components'].forEach(e => result = result.concat(getComponent(e)));

        //返回
        return result;
    };

    /**
     * 获取包含的变量
     * @param {string|null} str 字符串
     * @return {Array} 变量列表,可为空数组不为null
     */
    let get = function (str) {
        if (!str) return [];

        return Param.getParams(str);
    };

    /**
     * 去重
     * @param array 数组
     * @return {Array} 去重后的新数组,不为null可为空数组
     */
    let reduce = function (array) {
        if (!array || array.length === 0) return [];

        //去重
        let set = {};
        array.forEach(e => {
            let key = e['type']+":"+e['name'];
            set[key] = e;
        });

        //构造结果
        let result = [];
        for (let key in set) {
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