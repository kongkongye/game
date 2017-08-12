/**
 * 变量处理器
 *
 * (变量值改变时通知处理器)
 */
window.ParamHandler = (function () {
    var log = new Logger(LogConstant.SOURCE_PARAM_HANDLER);

    // var Handler = function () {};
    //
    // var NoIdHandler = {
    //     type: {
    //         name: [Handler,]
    //     }
    // };
    //
    // var IdHandler = {
    //     id: {   //页面id
    //         type: {
    //             name: [Handler,]
    //         }
    //     }
    // };

    //没有页面id的处理器列表
    //适合: common,player
    var noIdHandlers = {};

    //有页面id的处理器列表
    //适合: page,list,cmd,input,context
    var idHandlers = {};

    // var ListListeners = {
    //     id: [function (listAmount) {
    //
    //     }]
    // };

    var listListeners = {};

    // //条件处理器
    // var ConHandlers = {
    //     id: {          //页面id
    //         type: {    //条件类型
    //             name: [Handler,]
    //         }
    //     },
    // };

    var conHandlers = {};
    //缓冲(防止冗余的重复刷新)
    //'id:type:name true'的映射
    var conWaits = {};

    //缓冲(防止冗余的重复刷新)
    //'id:type:name true'的映射
    var waits = {};

    /**
     * 添加条件监听
     * @param id 页面id
     * @param type 条件类型
     * @param name 变量名(条件自行解析的)
     * @param handler 处理器
     */
    var addConListener = function(id, type, name, handler) {
        conHandlers[id] = conHandlers[id] || {};
        conHandlers[id][type] = conHandlers[id][type] || {};
        conHandlers[id][type][name] = conHandlers[id][type][name] || [];
        conHandlers[id][type][name].push(handler);
    };

    /**
     * 删除条件监听
     * @param pageId
     */
    var delConListener = function(pageId) {
        delete conHandlers[pageId];

        log.info(LogType.DETAIL, "清空页面ID'{0}'相关的所有条件处理器.", pageId);
    };

    /**
     * 添加条件改变
     * @param id 页面id,null表示全部页面
     * @param type 条件类型
     * @param name 变量名(条件自行解析的),null表示全部变量名
     */
    var addConChange = function(id, type, name) {
        if (!id) id = '';
        if (!name) name = '';
        conWaits[id+":"+type+":"+name] = true;
    };

    /**
     * 添加列表监听
     */
    var addListListener = function(id, handler) {
        listListeners[id] = listListeners[id] || [];
        listListeners[id].push(handler);
    };

    /**
     * 删除列表监听
     */
    var delListListener = function(pageId) {
        delete listListeners[pageId];

        log.info(LogType.DETAIL, "清空页面ID'{0}'相关的所有列表处理器.", pageId);
    };

    /**
     * 添加列表改变
     */
    var addListChange = function(id, listAmount) {
        var listListener = listListeners[id];
        if (listListener) listListener.forEach(function(handler) {
            handler(listAmount)
        });
    };

    /**
     * 添加变量定义
     * @param id 页面ID
     */
    var addParams = function(id, params) {
        params.forEach(function(e) {
            var type = e.type;
            var name = e.name;
            var handler = e.handler;

            var typeHandlers;

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

            var typeHandler = typeHandlers[type];
            if (!typeHandler) {
                typeHandler = {};
                typeHandlers[type] = typeHandler;
            }
            var nameHandler = typeHandler[name];
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
    var delParams = function(pageId) {
        delete idHandlers[pageId];

        log.info(LogType.DETAIL, "清空页面ID'{0}'相关的所有变量处理器.", pageId);
    };

    /**
     * 变量值有改变时调用
     * @param id type为common,player时不需要
     * @param name undefined或null时表示此类型下的全部名字变量都改变
     */
    var addChange = function(id, type, name) {
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
    var update = function(id, type, name) {
        var typeHandlers;
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
            var typeHandler = typeHandlers[type];
            if (typeHandler) {
                if (name) {
                    var nameHandler = typeHandler[name];
                    if (nameHandler) {
                        nameHandler.forEach(function(handler) {
                            handler()
                        });
                    }
                }else {
                    for (var key in typeHandler) {
                        if (typeHandler.hasOwnProperty(key)) {
                            typeHandler[key].forEach(function(handler) {
                                handler()
                            });
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
    var updateCon = function(id, type, name) {
        var typeHandlers = conHandlers[id];
        if (typeHandlers) {
            var nameHandlers = typeHandlers[type];
            if (nameHandlers) {
                if (name !== null) {//单个变量
                    var handlers = nameHandlers[name];
                    if (handlers) handlers.forEach(function(handler) {
                        handler()
                    });
                }else {//全部变量
                    for (var n in nameHandlers) {
                        if (nameHandlers.hasOwnProperty(n)) {
                            nameHandlers[n].forEach(function(handler) {
                                handler()
                            });
                        }
                    }
                }
            }
        }
    };

    //计时器: 刷新
    setInterval(function() {
        var key, args;
        //遍历变量缓存
        for (key in waits) {
            if (waits.hasOwnProperty(key)) {
                args = key.split(':');
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
        for (key in conWaits) {
            if (conWaits.hasOwnProperty(key)) {
                args = key.split(':');
                var id = args[0] || null;
                var type = args[1];
                var name = args[2] || null;

                if (id) {
                    updateCon(id, type, name);
                }else {
                    var pages = Slot.getPages();
                    for (var i in pages) {
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