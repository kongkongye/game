//负责解析服务端返回的页面配置
window.PageConfig = (function () {
    var log = new Logger(LogConstant.SOURCE_PAGE);

    // //页面定义格式
    // var PageDef = {
    //     page: {},
    //     params: [{
    //         type: "common",
    //         name: "paramName",
    //     }],
    //     inputDefaults: {     //输入变量默认值
    //        name: "默认值定义(未转换变量的)",
    //     },
    //     dependPaths: ['','']   //需要的前置页面路径列表
    // };

    //路径 页面定义
    var pages = {};

    /**
     * 获取页面的列表大小
     * @return {int} >=1
     */
    var getListSize = function (path) {
        return getPage(path).page['_size'] || 10;
    };

    /**
     * 获取页面的全部行
     * @return {Array} 不为null
     */
    var getLines = function (path) {
        return getPage(path).page.lines || [];
    };

    /**
     * 获取需要的列表变量
     * @return {Array} 需要的列表变量数组,项为变量名字符串
     */
    var getNeededListParams = function (path) {
        var neededListParams = [];
        pages[path].params.forEach(function(e) {
            if (e.type === ParamConstant.TYPE_LIST) {
                neededListParams.push(e.name);
            }
        });
        return neededListParams;
    };

    /**
     * 获取完整的页面定义
     */
    var getPage = function (path) {
        return pages[path];
    };

    /**
     * 增加页面
     * @param path 路径
     * @param {string} page 页面内容
     */
    var addPage = function (path, page) {
        //日志
        log.info(LogType.FUNC, '添加定义: {0}', path);

        //定义
        var def = {
            inputDefaults: {},
            dependPaths: []
        };
        //添加设置缓存
        pages[path] = def;

        //读取页面
        def.page = loadPage(def, $.parseXML(page).childNodes[0]);
    };

    /**
     * 读取页面
     */
    var loadPage = function (def, page) {
        var attrs = page.attributes;

        var enable = getBoolean(attrs['enable'], true);
        var title = getString(attrs['title'], null);
        var size = getInt(attrs['size'], 1);
        var context = getString(attrs['context'], '');
        var contextPlugin = context.split(':')[0];
        var contextKey = context.indexOf(':') !== -1?context.split(':')[1]:'';
        var virtualLines = [];

        page.childNodes.forEach(function(e) {
            if (e.nodeType === 1) {
                virtualLines.push(loadVirtualLine(def, e));
            }
        });

        return {
            type: 'page',
            _enable: enable,
            _title: title,
            _size: size,                   //列表大小,>=1
            _contextPlugin: contextPlugin, //可为''表示无
            _contextKey: contextKey,
            lines: virtualLines
        };
    };

    /**
     * 读取虚拟行
     * @param {Object} virtualLine 虚拟行对象
     */
    var loadVirtualLine = function (def, virtualLine) {
        var type = virtualLine.nodeName;
        if (type === 'line') {
            return loadLine(def, virtualLine);
        }else if (type === 'list') {
            return loadList(def, virtualLine);
        }else if (type === 'br') {
            return loadBr(def, virtualLine);
        }else if (type === 'import') {
            return loadImport(def, virtualLine);
        }else throw '虚拟行类型'+type+'未识别!';
    };

    /**
     * 读取行
     */
    var loadLine = function (def, virtualLine) {
        var attrs = virtualLine.attributes;

        var con = getString(attrs['con'], null);
        var align = getString(attrs['align'], null);
        var components = [];
        virtualLine.childNodes.forEach(function(e) {
            if (e.nodeType === 1) {
                components.push(loadComponent(def, e));
            }
        });
        return {
            type: 'line',
            _con: con,
            _align: align,
            components: components
        };
    };

    /**
     * 读取列表
     */
    var loadList = function (def, virtualLine) {
        var attrs = virtualLine.attributes;

        var con = getString(attrs['con'], null);
        var lines = [];

        virtualLine.childNodes.forEach(function(e) {
            if (e.nodeType === 1) {
                lines.push(loadVirtualLine(def, e))
            }
        });
        return {
            type: 'list',
            _con: con,
            lines: lines
        };
    };

    /**
     * 读取分隔行
     */
    var loadBr = function (def, virtualLine) {
        var attrs = virtualLine.attributes;

        var con = getString(attrs['con'], null);
        return {
            type: 'br',
            _con: con
        };
    };

    /**
     * 读取导入
     */
    var loadImport = function (def, virtualLine) {
        var attrs = virtualLine.attributes;

        var path = getString(attrs['path'], null);
        if (path) def.dependPaths.push(path);

        return {
            type: 'import',
            _path: path
        };
    };

    /**
     * 读取组件
     */
    var loadComponent = function (def, component) {
        var type = component.nodeName;
        if (type === 'text') {
            return loadText(def, component);
        }else if (type === 'button') {
            return loadButton(def, component);
        }else if (type === 'input') {
            return loadInput(def, component);
        }else if (type === 'container') {
            return loadContainer(def, component);
        }else throw '组件类型'+type+'未识别!';
    };

    /**
     * 读取文本
     */
    var loadText = function (def, component) {
        var attrs = component.attributes;

        var con = getString(attrs['con'], null);
        var style = getString(attrs['style'], null);
        var width = getInt(attrs['width'], 0);
        var align = getString(attrs['align'], null);
        var content = component.textContent;
        return {
            type: 'text',
            _con: con,
            _style: style,
            _width: width,
            _align: align,
            content: content
        };
    };

    /**
     * 读取按钮
     */
    var loadButton = function (def, component) {
        var attrs = component.attributes;

        var con = getString(attrs['con'], null);
        var style = getString(attrs['style'], null);
        var width = getInt(attrs['width'], 0);
        var cmd = getString(attrs['cmd'], null);
        var mode = getString(attrs['mode'], null);
        var content = component.textContent;
        return {
            type: 'button',
            _con: con,
            _style: style,
            _width: width,
            _cmd: cmd,
            _mode: mode,
            content: content
        };
    };

    /**
     * 读取输入
     */
    var loadInput = function (def, component) {
        var attrs = component.attributes;

        var con = getString(attrs['con'], null);
        var style = getString(attrs['style'], null);
        var width = getInt(attrs['width'], 0);
        var name = getString(attrs['name'], null);
        var type = getString(attrs['type'], null);
        var _default = getString(attrs['default'], null);
        var description = getString(attrs['description'], null);
        var fixWidth = getInt(attrs['fix-width'], 0);
        var multi = getBoolean(attrs['multi'], false);

        //添加进输入变量默认值
        if (_default) {
            def.inputDefaults[name] = _default;
        }

        return {
            type: 'input',
            _con: con,
            _style: style,
            _width: width,
            _name: name,
            _type: type,
            _default: _default,
            _description: description,
            '_fix-width': fixWidth,
            _multi: multi,
        };
    };

    /**
     * 读取容器
     */
    var loadContainer = function (def, component) {
        var attrs = component.attributes;

        var con = getString(attrs['con'], null);
        var style = getString(attrs['style'], null);
        var width = getInt(attrs['width'], 0);
        var align = getString(attrs['align'], null);
        var components = [];

        component.childNodes.forEach(function(e) {
            if (e.nodeType === 1) {
                components.push(loadComponent(def, e))
            }
        });

        return {
            type: 'container',
            _con: con,
            _style: style,
            _width: width,
            _align: align,
            components: components
        };
    };

    var getString = function (attr, def) {
        if (attr) return (attr.value || attr.value === '')?attr.value:def;
        else return def;
    };

    var getBoolean = function (attr, def) {
        if (attr) return attr.value+'' === 'true';
        else return def;
    };

    var getInt = function (attr, def) {
        if (!attr) return def;
        return parseInt(attr.value);
    };

    /**
     * 请求页面(内部会递归请求依赖页面)
     */
    var req = function (path) {
        var promise = $.Deferred();
        if (getPage(path)) {//页面已加载了,不用再请求
            promise.resolve();
        }else {//页面未加载
            Conn.send(PacketConstant.CLIENT190PAGE, {
                path: path
            }, true).then(function(e) {
                //解析
                var data = e.data;
                var path = data['path'];
                var page = data['page'];

                //页面定义已经有了,不重复添加
                if (getPage(path)) {
                    //成功解析
                    promise.resolve();
                    return;
                }

                //增加页面
                addPage(path, page);

                //还需要加载依赖页面呢
                //所有依赖的promise
                var dependPromises = [];
                getPage(path).dependPaths.forEach(function(e) {
                    if (!getPage(e)) {//依赖页面未加载
                        dependPromises.push(req(e));
                    }
                });
                $.whenall(dependPromises).then(function () {
                    //依赖都好了,此时再注入变量
                    pages[path].params = PageParam.getParams(path);

                    //成功解析
                    promise.resolve();
                }, function (reason) {
                    //失败解析
                    promise.reject(reason);
                });
            }, function(reason) {
                promise.reject(reason);
            });
        }
        return promise;
    };

    return  {
        getListSize: getListSize,
        getLines: getLines,
        getNeededListParams: getNeededListParams,
        getPage: getPage,
        req: req,
    };
})();