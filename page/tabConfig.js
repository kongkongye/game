//负责解析服务端返回的tab配置
window.TabConfig = (function () {
    var log = new Logger(LogConstant.SOURCE_PAGE);

    //路径 tab定义
    var tabs = {};

    /**
     * 请求tab,如果已经有缓存则会直接返回
     * @param tabPath tab路径
     * @return {Promise}
     */
    var reqTab = function(tabPath) {
        var promise = $.Deferred();
        if (tabs[tabPath]) {
            promise.resolve(tabs[tabPath]);
        }else {
            Conn.send(PacketConstant.CLIENT180TAB, {
                path: tabPath
            }, true).then(function(data) {
                data = data.data;
                //解析
                var path = data['path'];
                var tab = data['tab'];

                //必然相同
                if (path !== tabPath) throw '异常!';

                //增加tab
                addTab(tabPath, tab);

                //成功解析
                promise.resolve(tabs[tabPath]);
            }, function() {
                log.warn(LogType.DETAIL, "请求tab页面'{0}'失败!", tabPath);
                promise.reject();
            });
        }

        return promise;
    };

    /**
     * 获取根页面路径
     * @param path tab路径
     * @param index tab位置,从0开始
     * @return 根页面路径
     */
    var getRootPath = function(path, index) {
        return tabs[path].pages[index].path;
    };

    /**
     * 获取根页面命令参数
     * @param path tab路径
     * @param index tab位置,从0开始
     * @return 根页面命令参数,可为null
     */
    var getRootCmd = function(path, index) {
        return tabs[path].pages[index].cmd;
    };

    /**
     * 增加tab页
     * @param path 路径
     * @param tab tab页
     */
    var addTab = function (path, tab) {
        //日志
        log.info(LogType.FUNC, '添加定义: {0}', path);

        //读取tab页
        var tabDef = loadTab($.parseXML(tab).childNodes[0]);

        //添加设置缓存
        tabs[path] = tabDef;
    };

    /**
     * 读取tab
     */
    var loadTab = function (tab) {
        var attrs = tab.attributes;

        var enable = getBoolean(attrs['enable'], true);
        var pages = [];

        tab.childNodes.forEach(function(e) {
            if (e.nodeType === 1) {
                pages.push(loadTabPage(e));
            }
        });

        return {
            enable: enable,
            pages: pages
        };
    };

    /**
     * 读取tab页
     */
    var loadTabPage = function (page) {
        var attrs = page.attributes;

        var name = getString(attrs['name'], null);
        var path = getString(attrs['path'], null);
        var cmd = getString(attrs['cmd'], null);
        return {
            name: name,
            path: path,
            cmd: cmd,
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

    return  {
        reqTab: reqTab,
        getRootPath: getRootPath,
        getRootCmd: getRootCmd,
    };
})();