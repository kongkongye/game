(function () {
    let log = new Logger(LogConstant.SOURCE_SLOT);

    /**
     * 开启格子(异步)
     */
    let open = (tabPath, panelId, order, canClose) => {
        log.info(LogType.OPERATE, "开启格子,面板: '{0}', tab路径: '{1}' 可以关闭: {2}", panelId, tabPath, canClose);

        //面板不存在
        if (!Panel.hasPanel(panelId)) {
            log.warn(LogType.DETAIL, "不存在ID为'{0}'的面板,tab路径'{1}'不会显示!", panelId, tabPath);
            return;
        }

        TabConfig.reqTab(tabPath).then(tabDef => {
            //格子里增加
            Slot.addSlot(tabPath, tabDef, panelId, order, canClose);

            //选中新开启的格子
            Slot.selSlot(tabPath);

            //延时滚动到格子位置
            setTimeout(() => {
                let slotInfo = Slot.getSlotInfo(tabPath);
                if (slotInfo) {
                    let height = slotInfo.slotDom.offset().top-$(window).height()/4;
                    if (height < 0) height = 0;
                    $(document).scrollTop(height);
                }
            }, 100);
        });
    };

    /**
     * 关闭格子
     * @param tabPath 无tab路径表示关闭当前选中的tab
     */
    let close = tabPath => {
        if (!tabPath) tabPath = Slot.getSel();
        if (!tabPath) return;//当前未选中格子

        //history
        History.clear(tabPath);

        //遍历页面
        let slotInfo = Slot.getSlotInfo(tabPath);
        if (slotInfo) {
            let infos = slotInfo.infos;
            for (let pageId in infos) {
                if (infos.hasOwnProperty(pageId)) {
                    //paramHandler
                    ParamHandler.delParams(pageId);
                    ParamHandler.delListListener(pageId);
                    ParamHandler.delConListener(pageId);
                    //param
                    Param.clearAll(pageId);
                }
            }
        }

        //slot
        Slot.clear(tabPath);
    };

    /**
     * 关闭全部格子
     */
    let closeAll = () => {
        //获取全部tab路径
        let slotInfos = Slot.getSlotInfos();
        let slots = [];
        for (let key in slotInfos) {
            if (slotInfos.hasOwnProperty(key)) {
                slots.push(key);
            }
        }
        //遍历关闭
        slots.forEach(tabPath => {
            close(tabPath);
        });
    };

    Cmd.registerClientHandler(CmdConstant.CMD_SLOT, {
        handle: function (id, arg) {
            let args = arg.split(' ');
            if (args.length >= 1) {
                if (args[0] === 'open') {//slot open tab路径 面板ID 顺序 是否可以关闭
                    if (args.length >= 5) open(args[1], args[2], args[3], args[4] === 'true');
                }else if (args[0] === 'close') {//slot close [tab路径] 无tab路径表示关闭当前选中的tab
                    if (args.length >= 2) close(args[1]);
                    else close();
                }else if (args[0] === 'closeAll') {//slot closeAll
                    closeAll();
                }
            }
        }
    });
})();