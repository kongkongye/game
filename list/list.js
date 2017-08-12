window.List = (function () {
    let log = new Logger(LogConstant.SOURCE_LIST);

    /**
     * 列表第一页
     */
    let listFirst = function (id) {
        log.debug(LogType.OPERATE, '列表第一页');
        changePage(id, 1);
    };

    /**
     * 列表最后页
     */
    let listLast = function (id) {
        log.debug(LogType.OPERATE, '列表最后页');
        let pageInfo = Slot.getPageInfo(id);
        changePage(id, Common.getMaxPage(pageInfo.listTotal, PageConfig.getListSize(pageInfo.path) || 1));
    };

    /**
     * 列表上一页
     */
    let listPre = function (id) {
        log.debug(LogType.OPERATE, '列表上一页');
        let pageInfo = Slot.getPageInfo(id);
        changePage(id, pageInfo.page-1);
    };

    /**
     * 列表下一页
     */
    let listNext = function (id) {
        log.debug(LogType.OPERATE, '列表下一页');
        let pageInfo = Slot.getPageInfo(id);
        changePage(id, pageInfo.page+1);
    };

    /**
     * 列表指定页
     */
    let listTo = function (id, tarPage) {
        if (!tarPage || tarPage <= 0) {
            log.debug(LogType.DETAIL, '列表页面必须>=1');
            return;
        }

        log.debug(LogType.OPERATE, "列表第'{0}'页", tarPage);
        changePage(id, tarPage);
    };

    /**
     * 更换页面
     * @param id 页面id
     * @param tarPage 目标页面,页面从1开始
     */
    let changePage = function (id, tarPage) {
        let pageInfo = Slot.getPageInfo(id);
        let pageSize = PageConfig.getListSize(pageInfo.path);

        //页面修正
        let maxPage = Common.getMaxPage(pageInfo.listTotal, pageSize);
        if (maxPage < 1) maxPage = 1;
        if (tarPage < 1) tarPage = 1;
        else if (tarPage > maxPage) tarPage = maxPage;

        log.debug(LogType.DETAIL, "前往列表第'{0}'页(修正后)", tarPage);

        //与旧的一样
        if (pageInfo.page === tarPage) return;

        //更新缓存
        pageInfo.page = tarPage;
        //通知变量改变
        ParamHandler.addChange(id, ParamConstant.TYPE_CONTEXT, ParamConstant.CONTEXT_PARAM_LIST_PAGE);

        //刷新列表变量
        Param.refreshListParams(id);
    };

    //注册客户端命令
    Cmd.registerClientHandler(CmdConstant.CMD_LIST, {
        handle: function (id, arg) {
            let args = arg.split(' ');
            if (args.length >= 1) {
                if (args[0] === 'first') {
                    listFirst(id);
                }else if (args[0] === 'last') {
                    listLast(id);
                }else if (args[0] === 'pre') {
                    listPre(id);
                }else if (args[0] === 'next') {
                    listNext(id);
                }else if (args[0] === 'to') {
                    if (args.length >= 2) {
                        listTo(id, parseInt(args[1]));
                    }
                }
            }
        }
    });
})();