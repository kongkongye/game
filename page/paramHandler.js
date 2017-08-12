/**
 * 变量处理器
 *
 * (变量值改变时通知处理器)
 */
window.ParamHandler = (function () {
    let log = new Logger(LogConstant.SOURCE_PARAM_HANDLER);

    // let Handler = function () {};
    //
    // let NoIdHandler = {
    //     type: {
    //         name: [Handler,]
    //     }
    // };
    //
    // let IdHandler = {
    //     id: {   //页面id
    //         type: {
    //             name: [Handler,]
    //         }
    //     }
    // };

    //没有页面id的处理器列表
    //适合: common,player
    let noIdHandlers = {};

    //有页面id的处理器列表
    //适合: page,list,cmd,input,context
    let idHandlers = {};

    // let ListListeners = {
    //     id: [function (listAmount) {
    //
    //     }]
    // };

    let listListeners = {};

    // //条件处理器
    // let ConHandlers = {
    //     id: {          //页面id
    //         type: {    //条件类型
    //             name: [Handler,]
    //         }
    //     },
    // };

    let conHandlers = {};
    //缓冲(防止冗余的重复刷新)
    //'id:type:name true'的映射
    let conWaits = {};

    //缓冲(防止冗余的重复刷新)
    //'id:type:name true'的映射
    let waits = {};

    /**
     * 添加条件监听
     * @param id 页面id
     * @param type 条件类型
     * @param name 变量名(条件自行解析的)
     * @param handler 处理器
     */
    let addConListener = (id, type, name, handler) => {
        conHandlers[id] = conHandlers[id] || {};
        conHandlers[id][type] = conHandlers[id][type] || {};
        conHandlers[id][type][name] = conHandlers[id][type][name] || [];
        conHandlers[id][type][name].push(handler);
    };

    /**
     * 删除条件监听
     * @param pageId
     */
    let delConListener = pageId => {
        delete conHandlers[pageId];

        log.info(LogType.DETAIL, "清空页面ID'{0}'相关的所有条件处理器.", pageId);
    };

    /**
     * 添加条件改变
     * @param id 页面id,null表示全部页面
     * @param type 条件类型
     * @param name 变量名(条件自行解析的),null表示全部变量名
     */
    let addConChange = (id, type, name) => {
        if (!id) id = '';
        if (!name) name = '';
        conWaits[id+":"+type+":"+name] = true;
    };

    /**
     * 添加列表监听
     */
    let addListListener = (id, handler) => {
        listListeners[id] = listListeners[id] || [];
        listListeners[id].push(handler);
    };

    /**
     * 删除列表监听
     */
    let delListListener = pageId => {
        delete listListeners[pageId];

        log.info(LogType.DETAIL, "清空页面ID'{0}'相关的所有列表处理器.", pageId);
    };

    /**
     * 添加列表改变
     */
    let addListChange = (id, listAmount) => {
        let listListener = listListeners[id];
        if (listListener) listListener.forEach(handler => handler(listAmount));
    };

    /**
     * 添加变量定义
     * @param id 页面ID
     */
    let addParams = (id, params) => {
        params.forEach(e => {
            let type = e.type;
            let name = e.name;
            let handler = e.handler;

            let typeHandlers;

            if (type === ParamConstant.TYPE_COMMON ||
                type === ParamConstant.TYPE_PLAYER) {
                typeHandlers = noIdHandlers;
            }else if (type === ParamConstant.TYPE_PAGE ||
                type === ParamConstant.TYPE_LIST ||
                type === ParamConstant.TYPE_CMD ||
                type === ParamConstant.TYPE_INPUT ||
                type === ParamConstant.TYPE_CONTEXT) {
                typeHandlers = idHandlers[id];
                if (!typeHandlers) {
                    typeHandlers = {};
                    idHandlers[id] = typeHandlers;
                }
            }else throw "变量类型'"+type+"'无法处理!";

            let typeHandler = typeHandlers[type];
            if (!typeHandler) {
                typeHandler = {};
                typeHandlers[type] = typeHandler;
            }
            let nameHandler = typeHandler[name];
            if (!nameHandler) {
                nameHandler = [];
                typeHandler[name] = nameHandler;
            }
            nameHandler.push(handler);

            //初始更新
            addChange(id, type, name);
        });
    };

    /**
     * 删除指定页面id的所有变量
     */
    let delParams = pageId => {
        delete idHandlers[pageId];

        log.info(LogType.DETAIL, "清空页面ID'{0}'相关的所有变量处理器.", pageId);
    };

    /**
     * 变量值有改变时调用
     * @param id type为common,player时不需要
     * @param name undefined或null时表示此类型下的全部名字变量都改变
     */
    let addChange = (id, type, name) => {
        if (!name) name = '';
        if (type === ParamConstant.TYPE_COMMON ||
            type === ParamConstant.TYPE_PLAYER) {
            waits[type+":"+name] = true;
        }else if (type === ParamConstant.TYPE_PAGE ||
            type === ParamConstant.TYPE_LIST ||
            type === ParamConstant.TYPE_CMD ||
            type === ParamConstant.TYPE_INPUT ||
            type === ParamConstant.TYPE_CONTEXT) {
            waits[id+":"+type+":"+name] = true;
        }else throw "变量类型'"+type+"'无法处理!";
    };

    /**
     * @param id type为common,player时不需要
     * @param name ''时表示此类型下全部变量名都更新
     */
    let update = (id, type, name) => {
        let typeHandlers;
        if (type === ParamConstant.TYPE_COMMON ||
            type === ParamConstant.TYPE_PLAYER) {
            typeHandlers = noIdHandlers;
        }else if (type === ParamConstant.TYPE_PAGE ||
            type === ParamConstant.TYPE_LIST ||
            type === ParamConstant.TYPE_CMD ||
            type === ParamConstant.TYPE_INPUT ||
            type === ParamConstant.TYPE_CONTEXT) {
            typeHandlers = idHandlers[id];
        }else throw "变量类型'"+type+"'无法处理!";

        if (typeHandlers) {
            let typeHandler = typeHandlers[type];
            if (typeHandler) {
                if (name) {
                    let nameHandler = typeHandler[name];
                    if (nameHandler) {
                        nameHandler.forEach(handler => handler());
                    }
                }else {
                    for (let key in typeHandler) {
                        if (typeHandler.hasOwnProperty(key)) {
                            typeHandler[key].forEach(handler => handler());
                        }
                    }
                }
            }
        }
    };

    /**
     * @param id 页面id,不为null
     * @param type 条件类型,不为null
     * @param name null表示全部变量
     */
    let updateCon = (id, type, name) => {
        let typeHandlers = conHandlers[id];
        if (typeHandlers) {
            let nameHandlers = typeHandlers[type];
            if (nameHandlers) {
                if (name !== null) {//单个变量
                    let handlers = nameHandlers[name];
                    if (handlers) handlers.forEach(handler => handler());
                }else {//全部变量
                    for (let n in nameHandlers) {
                        if (nameHandlers.hasOwnProperty(n)) {
                            nameHandlers[n].forEach(handler => handler());
                        }
                    }
                }
            }
        }
    };

    //计时器: 刷新
    setInterval(() => {
        //遍历变量缓存
        for (let key in waits) {
            if (waits.hasOwnProperty(key)) {
                let args = key.split(':');
                if (args.length === 2) {
                    update(null, args[0], args[1]);
                }else if (args.length === 3) {
                    update(args[0], args[1], args[2]);
                }else throw '异常!';
            }
        }
        //重置
        waits = {};

        //遍历条件缓存
        for (let key in conWaits) {
            if (conWaits.hasOwnProperty(key)) {
                let args = key.split(':');
                let id = args[0] || null;
                let type = args[1];
                let name = args[2] || null;

                if (id) {
                    updateCon(id, type, name);
                }else {
                    let pages = Slot.getPages();
                    for (let i in pages) {
                        if (pages.hasOwnProperty(i)) {
                            updateCon(i, type, name);
                        }
                    }
                }
            }
        }
        //重置
        conWaits = {};
    }, 200);

    return {
        addParams: addParams,
        delParams: delParams,
        addChange: addChange,

        addListListener: addListListener,
        delListListener: delListListener,
        addListChange: addListChange,

        addConListener: addConListener,
        delConListener: delConListener,
        addConChange: addConChange,
    };
})();