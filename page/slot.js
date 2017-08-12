//格子管理
//前端有哪些页面在哪个格子显示都缓存在这里
window.Slot = (function () {
    let log = new Logger(LogConstant.SOURCE_SLOT);

    // /**
    //  * 格子信息
    //  */
    // let SlotInfo = {
    //     path: path,              //tab路径
    //     canClose: true,          //是否可以关闭
    //     slotDom: slotDom,        //固定存在的
    //     slotBodyDom: slotBodyDom,//固定存在的
    //     tabDom: tabDom,          //固定存在的
    //     pageId: pageId,          //当前页面ID(会改变)
    //     pageIndex: 0,            //当前页面的位置(会改变)
    //     idToIndexes: {
    //         id: 1
    //     },
    //     infos: {
    //         id: PageInfo,
    //     },
    // };

    // let PageInfo = {
    //     id: id,
    //     path: path,
    //     rootCmd: '',        //根页面初始命令参数,默认无
    //     args: {key: value}  //命令参数,可选,默认无
    //     header: headerDom,  //tab头
    //     body: bodyDom,      //tab体
    //
    //     defaultInit: false, //输入变量默认值是否初始化
    //     domInit: false,     //dom是否初始化
    //
    //     page: 1,            //列表当前页
    //     listTotal: 0,       //列表项总数
    // };

    /**
     * 格子信息
     * '格子路径 格子信息'的映射
     */
    let slots = {};

    //页面ID 页面信息
    let pages = {};

    //当前选中的格子路径,可以为null
    let sel;

    /**
     * 获取选择的格子路径
     */
    let getSel = () => sel;

    /**
     * 获取全部格子信息
     */
    let getSlotInfos = () => slots;

    /**
     * 获取全部页面信息
     */
    let getPages = () => pages;

    /**
     * 获取格子信息
     */
    let getSlotInfo = tabPath => slots[tabPath];

    /**
     * 获取页面信息
     * @return {Object} 页面信息,不存在返回null
     */
    let getPageInfo = id => pages[id];

    /**
     * 检测初始化输入默认值
     * 输入变量默认需要依赖其它变量才能生成
     * 时机: 第一次其它变量变完整时
     */
    let checkInitDefault = pageId => {
        let pageInfo = getPageInfo(pageId);
        //防止重复初始化
        if (!pageInfo.defaultInit) {
            //更新缓存
            pageInfo.defaultInit = true;

            //更新默认值,然后更新输入变量
            let inputParams = {};
            let inputDefaults = PageConfig.getPage(pageInfo.path).inputDefaults;
            for (let name in inputDefaults) {
                if (inputDefaults.hasOwnProperty(name)) {
                    inputParams[name] = {
                        value: Param.replaceParams(pageId, inputDefaults[name], -1),
                        timeout: -1
                    }
                }
            }
            //设置输入变量
            Param.setInputParams(pageId, inputParams);
        }
    };

    /**
     * 清除指定tab路径相关缓存
     */
    let clear = tabPath => {
        //如果正好选中要清除的格子,则取消选中格子
        if (sel === tabPath) {
            selSlot(null);
        }

        //格子信息不存在
        if (!slots[tabPath]) return;

        //删除页面
        let slotInfo = slots[tabPath];
        let infos = slotInfo.infos;
        for (let pageId in infos) {
            if (infos.hasOwnProperty(pageId)) {
                delete pages[pageId];
            }
        }
        //删除格子
        delete slots[tabPath];

        //删除格子dom
        slotInfo.slotDom.remove();

        //日志
        log.info(LogType.DETAIL, "清空tab路径'{0}'相关格子与页面信息.", tabPath);
    };

    /**
     * 返回主界面(即根界面)
     */
    let main = () => {
        //当前没选中tab
        if(!sel) return;

        let slotInfo = slots[sel];
        let rootCmd = TabConfig.getRootCmd(slotInfo.path, slotInfo.pageIndex);
        join(TabConfig.getRootPath(slotInfo.path, slotInfo.idToIndexes[slotInfo.pageId]), null, rootCmd);
    };

    /**
     * 进入页面
     * @param pagePath 页面路径
     * @param args 可选,默认无
     * @param rootCmd 可选,默认无
     */
    let join = function (pagePath, args, rootCmd) {
        //当前没选中tab
        if (!sel) return;

        let pageIndex = slots[sel].pageIndex;

        //添加历史
        History.add(sel, pageIndex, {
            path: pagePath,
            rootCmd: rootCmd,
            args: args,
        });

        //执行显示
        show(pagePath, args, rootCmd);
    };

    /**
     * 刷新
     * @param refreshPage 是否刷新整个页面,默认false
     */
    let refresh = (refreshPage) => {
        //当前没选中tab
        if (!sel) return;

        log.info(LogType.OPERATE, '刷新');

        if (refreshPage) {
            //重新显示页面
            let pageInfo = getPageInfo(slots[sel].pageId);
            show(pageInfo.path, pageInfo.args, pageInfo.rootCmd);
        }else {
            //请求缺少的变量
            Param.requestLackParams(slots[sel].pageId, true);
        }
    };

    /**
     * 返回上一页
     */
    let back = () => {
        //当前没选中tab
        if (!sel) return;

        let slotInfo = slots[sel];
        let selIndex = slotInfo.idToIndexes[slotInfo.pageId];
        let history = History.pop(sel, selIndex);
        if (history) {
            //显示上一页
            show(history.path, history.args, history.rootCmd);
            //日志
            log.debug(LogType.OPERATE, "格子'{0}'返回上一页!", sel);
        }else {
            //显示主页面
            main();
            //日志
            log.debug(LogType.OPERATE, "格子'{0}'没有上一页,返回主界面!", sel);
        }
    };

    /**
     * 执行显示(异步延时)
     * (必然选中了某个slot)
     * @param pagePath 页面路径
     * @param args 可选,默认无
     */
    let show = function (pagePath, args, rootCmd) {
        let slotInfo = slots[sel];
        let pageId = slotInfo.pageId;
        let pageInfo = getPageInfo(pageId);

        //清除Param
        Param.clearAll(pageId);
        //清除ParamHandler
        ParamHandler.delParams(pageId);
        ParamHandler.delListListener(pageId);
        ParamHandler.delConListener(pageId);

        //设置命令变量
        Param.setCmdParams(pageId, args);

        //更新页面信息
        pageInfo.path = pagePath;
        pageInfo.rootCmd = rootCmd;
        pageInfo.args = args;
        pageInfo.page = 1;
        pageInfo.listTotal = 0;
        pageInfo.defaultInit = false;
        pageInfo.domInit = false;
        updateShow(slotInfo);

        //更新顶部按钮
        updateTopStatus();
    };

    /**
     * 选中格子
     * @param {string|null} tabPath 可以为null表示取消选中格子
     */
    let selSlot = tabPath => {
        //与旧的一样
        if (sel === tabPath) return;

        sel = tabPath;

        //更新格子状态
        updateSlotStatus(tabPath);

        //更新顶部按钮
        updateTopStatus();
    };

    /**
     * 由页面id来选择格子
     */
    let selSlotByPageId = pageId => {
        if (pageId) {
            for (let tabPath in slots) {
                if (slots.hasOwnProperty(tabPath)) {
                    for (let id in slots[tabPath].infos) {
                        if (id === pageId) {
                            selSlot(tabPath);
                            return;
                        }
                    }
                }
            }
        }
    };

    /**
     * 添加格子(如果已经增加,则会无反应)
     */
    let addSlot = function (tabPath, tabDef, panelId, order, canClose) {
        //不重复增加
        if (slots[tabPath]) return;

        let slotDom = $('<div class="slot panel"></div>');
        let slotBodyDom = $('<div></div>');
        slotDom.append(slotBodyDom);

        //检测添加格子到面板
        Panel.addSlot(panelId, slotDom);

        let slotInfo = {
            path: tabPath,
            canClose: canClose,
            slotDom: slotDom,
            slotBodyDom: slotBodyDom,
        };
        slots[tabPath] = slotInfo;

        //顺序
        slotDom.css('order', order);

        //事件
        slotDom.on('click', () => selSlot(tabPath));

        //新建tab页面
        createTab(slotInfo, tabPath, tabDef);
        slotBodyDom.append(slotInfo.tabDom);

        //默认选中一个格子
        if (!sel) {
            selSlot(tabPath);
        }

        //更新顶部按钮
        updateTopStatus();
    };

    /**
     * 创建tab页
     */
    let createTab = (slotInfo, tabPath, tabDef) => {
        //构建
        let pageId = null;
        let pageIndex = null;
        let idToIndexes = {};
        let infos = {};

        //显示
        let tabDom = $('<div class="tab"></div>');
        let tabHeaderDom = $('<div class="tab-header"></div>');
        let tabBodyDom = $('<div class="tab-body"></div>');

        //更新缓存
        let pages = tabDef['pages'];
        for (let i=0;i<pages.length;i++) {
            let page = pages[i];
            let pageInfo = createPage(page['path']);
            let id = pageInfo.id;
            idToIndexes[id] = i;
            infos[id] = pageInfo;

            //rootCmd
            pageInfo.rootCmd = TabConfig.getRootCmd(tabPath, i);

            //检测设置第一项为当前页
            if (!pageId) {
                pageId = id;
                pageIndex = 0;
            }

            //header
            let tabHeaderItem = $('<span></span>');
            tabHeaderItem.text(page['name']);
            tabHeaderItem.on('click', () => changeTab(slotInfo, id));
            pageInfo.header = tabHeaderItem;

            //body
            let tabBodyItem = $('<div></div>');
            pageInfo.body = tabBodyItem;

            //添加
            tabHeaderDom.append(tabHeaderItem);
            tabBodyDom.append(tabBodyItem);

            //添加默认历史
            History.add(tabPath, i, {
                path: page['path'],
                rootCmd: pageInfo.rootCmd,
            });
        }

        //单个页面时加特殊css
        if (pages.length <= 1) {
            tabHeaderDom.addClass('tab-header-single');
            tabBodyDom.addClass('tab-body-single');
        }

        //组合
        tabDom.append(tabHeaderDom);
        tabDom.append(tabBodyDom);

        //返回
        slotInfo.pageId = pageId;
        slotInfo.pageIndex = pageIndex;
        slotInfo.idToIndexes = idToIndexes;
        slotInfo.infos = infos;
        slotInfo.tabDom = tabDom;

        //更新显示
        updateShow(slotInfo);
    };

    /**
     * 新建页面(只生成id,不加载页面)
     * @param path 页面路径
     * @return {Object} 页面信息
     */
    let createPage = path => {
        //生成id
        let id = Common.getRandomId(6);
        let pageInfo = {
            id: id,
            path: path,
            page: 1,
        };
        pages[id] = pageInfo;
        return pageInfo;
    };

    /**
     * 改变tab页
     */
    let changeTab = (slotInfo, pageId) => {
        //日志
        log.debug(LogType.OPERATE, '改变页面: {0}', getPageInfo(pageId).path);

        //更新缓存
        slotInfo.pageId = pageId;
        slotInfo.pageIndex = slotInfo.idToIndexes[pageId];

        //更新显示
        updateShow(slotInfo);

        //更新顶部按钮
        updateTopStatus();
    };

    /**
     * 更新显示
     */
    let updateShow = slotInfo => {
        //请求页面
        let pageInfo = getPageInfo(slotInfo.pageId);
        let reqPagePromise = PageConfig.req(pageInfo.path);
        //请求变量
        let rootCmd = pageInfo.rootCmd;
        let needParams = Param.getParams(rootCmd);
        let lackParams = Param.getLackParams(slotInfo.pageId, needParams);
        let reqParamsPromise = Param.requestParamsForCmd(slotInfo.pageId, pageInfo.path, lackParams);

        //等待两个都完成
        $.when(reqParamsPromise, reqPagePromise).then((v1, v2) => {
            //先添加变量(模拟收到包)(因为这里给处理了)
            if (v1) {
                Conn.onReceive({
                    id: v1.id,
                    reqId: 0,
                    data: v1.data,
                });
            }

            let pageInfo = getPageInfo(slotInfo.pageId);
            if (!pageInfo) return;

            //设置命令变量
            if (rootCmd) {
                let args = {};
                let rootCmdResult = Param.replaceParams(slotInfo.pageId, rootCmd, -1);
                rootCmdResult.split(' ').forEach(s => {
                    let ss = Common.split(s, '=', 2);
                    args[ss[0]] = ss[1];
                });
                //更新变量
                Param.setCmdParams(slotInfo.pageId, args);
                //更新页面内命令变量缓存
                pageInfo.args = args;
            }

            //初始化页面
            //防止重复初始化
            if (!pageInfo.domInit) {
                //日志
                log.debug(LogType.DETAIL, '初始化页面: {0}', pageInfo.path);
                //更新缓存
                pageInfo.domInit = true;

                //创建页面dom
                let pageDom = createPageDom(slotInfo.pageId);
                //更新body
                pageInfo.body.empty();
                pageInfo.body.append(pageDom);
            }

            //更新tab页显示状态
            updateTabStatus(slotInfo);

            //请求缺少的变量
            Param.requestLackParams(slotInfo.pageId, true);
        });
    };

    /**
     * 创建页面dom
     * @param id 页面id
     */
    let createPageDom = id => {
        let pageInfo = getPageInfo(id);
        let pageDef = PageConfig.getPage(pageInfo.path);
        if (pageDef) {
            let page = pageDef['page'];

            //未启用
            if (!page['_enable']) throw '页面未启用!';

            //获取
            return PageShow.getShow(id, pageInfo.path, page);
        }else {
            throw '路径为"'+path+'"的页面未找到!';
        }
    };

    /**
     * 检测更新顶部按钮状态
     */
    let updateTopStatus = () => {
        //返回
        $('#top-back').prop('disabled', !sel || !History.hasBack(sel, slots[sel].pageIndex));
        //主页
        $('#top-main').prop('disabled', !sel);
        //刷新
        $('#top-refresh').prop('disabled', !sel);
        //关闭
        $('#top-close').prop('disabled', !sel || !slots[sel].canClose);
    };

    /**
     * 检测更新所有格子的状态(边框效果)
     * @param {string|null} tabPath 可以为null
     */
    let updateSlotStatus = tabPath => {
        for (let key in slots) {
            if (slots.hasOwnProperty(key)) {
                let slotInfo = slots[key];
                if (key === tabPath) slotInfo.slotDom.addClass('slot-active');
                else slotInfo.slotDom.removeClass('slot-active');
            }
        }
    };

    /**
     * 检测更新tab页的显示状态(显示/隐藏)
     */
    let updateTabStatus = slotInfo => {
        for (let id in slotInfo.infos) {
            if (slotInfo.infos.hasOwnProperty(id)) {
                let pageInfo = getPageInfo(id);
                if (id === slotInfo.pageId) {
                    pageInfo.header.addClass('active');
                    pageInfo.body.show();
                }else {
                    pageInfo.header.removeClass('active');
                    pageInfo.body.hide();
                }
            }
        }
    };

    //初始更新顶部按钮
    $(document).ready(() => updateTopStatus());

    return {
        addSlot: addSlot,
        selSlot: selSlot,
        selSlotByPageId: selSlotByPageId,
        join: join,
        main: main,
        refresh: refresh,
        back: back,
        checkInitDefault: checkInitDefault,
        getSlotInfos: getSlotInfos,
        getPages: getPages,
        getSel: getSel,
        getSlotInfo: getSlotInfo,
        getPageInfo: getPageInfo,
        clear: clear,
    };
})();