window.Param = (function () {
    let log = new Logger(LogConstant.SOURCE_PARAM);

    // let Pipes = {
    //     plugin: {
    //         name: {
    //             key: value,
    //         },
    //     },
    // };

    //所有管道
    let pipes = {};

    // let TypeParam = {
    //     name: 'value'
    // }

    // let IdParam = {
    //     id-1: TypeParam,
    //     id-2: TypeParam
    // }

    // let CommonParams = TypeParam

    let commonParams = {};

    // let PlayerParams = TypeParam

    let playerParams = {};

    // let PageParams = IdParam

    let pageParams = {};

    // let ListParams = {
    //     id-1: {
    //         '0': TypeParam,
    //         '1': TypeParam,
    //     },
    //     id-2: {
    //         '0': TypeParam,
    //         '1': TypeParam,
    //     },
    // }

    let listParams = {};

    // let CmdParams = IdParam

    let cmdParams = {};

    // let InputParams = IdParam

    let inputParams = {};

    /**
     * 获取全部变量定义
     * @param {string} str 可能包含变量的字符串
     * @return {Array} 变量定义数组,不为null可为空数组
     */
    let getParams = function (str) {
        let params = [];

        if (str) {
            while (true) {
                let matcher = ParamConstant.REGEX.exec(str);
                if (matcher === null) break;
                params.push({
                    type: matcher[1],
                    name: matcher[2].split('|')[0]
                });

            }
        }
        return params;
    };

    /**
     * 获取缺少的变量(会添加全部需要后端解析的变量)
     * @param params 需要的变量
     */
    let getLackParams = function (id, params) {
        let result = [];

        params.forEach(e => {
            //判断
            if (e.type === ParamConstant.TYPE_COMMON ||
                e.type === ParamConstant.TYPE_PLAYER ||
                e.type === ParamConstant.TYPE_PAGE ||
                e.type === ParamConstant.TYPE_LIST) {//cmd,input,context变量都是前端解析的,请求后端并没有什么用
                result.push({
                    type: e.type,
                    name: e.name
                });
            }
        });

        return result;
    };

    /**
     * 替换变量
     * @param {string} str 可能包含变量的字符串
     * @param {integer} listIndex 列表中的位置,从0开始,-1表示无列表
     */
    let replaceParams = function (id, str, listIndex) {
        if (!str) return str;
        return str.replace(ParamConstant.REGEX, function (match, type, nameWithPipes) {
            let pipes = nameWithPipes.split('|');
            let name = pipes[0];
            pipes.splice(0, 1);

            //获取值
            let value = getValue(id, type, name, listIndex);
            return convertPipe(value, pipes);
        });
    };

    /**
     * 添加命令变量
     * @param {Object} args 命令变量,格式'名-值'映射,可选,默认无
     */
    let setCmdParams = function (id, args) {
        if (args) {
            cmdParams[id] = args;

            let typeParam = cmdParams[id];
            for (let name in typeParam) {
                if (typeParam.hasOwnProperty(name)) {
                    ParamHandler.addChange(id, ParamConstant.TYPE_CMD, name);
                }
            }
        }
    };

    /**
     * 设置输入变量
     */
    let setInputParams = function (id, typeParam) {
        inputParams[id] = typeParam;

        for (let name in typeParam) {
            if (typeParam.hasOwnProperty(name)) {
                ParamHandler.addChange(id, ParamConstant.TYPE_INPUT, name);
            }
        }
    };

    /**
     * 设置输入变量
     */
    let setInputParam = function (id, name, value) {
        if (!inputParams[id]) {
            inputParams[id] = {};
        }

        value = value.trim();
        if (value) {
            inputParams[id][name] = value;
        }else {
            delete inputParams[id][name];
        }

        //特殊情况,输入变量可能快速触发多次,因此通知改变加上延时好点
        Common.debounce(Constant.DebounceTypePrefix_InputParam+id+name, () => ParamHandler.addChange(id, ParamConstant.TYPE_INPUT, name), 500);
    };

    /**
     * 刷新列表变量
     */
    let refreshListParams = function (id) {
        //获取需要的列表变量
        let params = [];
        let pageInfo = Slot.getPageInfo(id);
        PageConfig.getNeededListParams(pageInfo.path).forEach(e => {
            params.push({
                type: ParamConstant.TYPE_LIST,
                name: e
            });
        });
        //请求
        requestParams(id, params, true);
    };

    /**
     * 请求缺少的变量
     */
    let requestLackParams = function (pageId, clearList) {
        let pageInfo = Slot.getPageInfo(pageId);
        let pageDef = PageConfig.getPage(pageInfo.path);
        let lackParams = getLackParams(pageId, pageDef.params);
        if (lackParams.length > 0) requestParams(pageId, lackParams, clearList);
    };

    /**
     * 请求变量
     * @param clearList 是否清空列表
     */
    let requestParams = function (pageId, params, clearList) {
        if (params && params.length > 0) {
            let pageInfo = Slot.getPageInfo(pageId);
            let pageDef = PageConfig.getPage(pageInfo.path).page;
            return Conn.send(PacketConstant.CLIENT200PARAM, {
                pageId: pageId,
                path: pageInfo.path,
                args: pageInfo.args,
                pageSize: pageDef['_size'],
                page: pageInfo.page,
                contextPlugin: pageDef['_contextPlugin'],
                contextKey: pageDef['_contextKey'],
                clearList: clearList,
                params: params
            });
        }
    };

    /**
     * 请求变量: 为命令服务
     * @return 返回promise
     */
    let requestParamsForCmd = function (pageId, pagePath, params) {
        if (params && params.length > 0) {
            return Conn.send(PacketConstant.CLIENT200PARAM, {
                pageId: pageId,
                path: pagePath,
                args: {},
                pageSize: 1,
                page: 1,
                clearList: false,
                params: params
            }, true);
        }else {
            let promise = $.Deferred();
            promise.resolve();
            return promise;
        }
    };

    /**
     * 获取变量值
     * @param listIndex 在列表中的位置,-1表示无列表
     * @return {string|null} 没有则返回null
     */
    let getValue = function (id, type, name, listIndex) {
        let typeContext = null;
        if (type === ParamConstant.TYPE_CONTEXT) {
            let result = getContextParam(id, name, listIndex);
            if (result === undefined) result = null;
            return result;
        }else if (type === ParamConstant.TYPE_COMMON) {
            typeContext = commonParams;
        }else if (type === ParamConstant.TYPE_PLAYER) {
            typeContext = playerParams;
        }else if (type === ParamConstant.TYPE_PAGE) {
            typeContext = pageParams[id];
        }else if (type === ParamConstant.TYPE_LIST) {
            if (listIndex !== -1) {
                let pathContext = listParams[id];
                if (pathContext) {
                    typeContext = pathContext[''+listIndex];
                }
            }
        }else if (type === ParamConstant.TYPE_CMD) {
            typeContext = cmdParams[id];
        }else if (type === ParamConstant.TYPE_INPUT) {
            typeContext = inputParams[id];
        }else throw '变量类型"'+type+'"无法处理!';

        if (typeContext) {
            let result = typeContext[name];
            if (result === undefined) result = null;
            return result;
        }

        return null;
    };

    /**
     * 增加变量
     * @param paramInfo 变量信息
     */
    let addParam = function (id, paramInfo) {
        let type = paramInfo['type'];
        let name = paramInfo['name'];
        let value = paramInfo['value'];
        let index = paramInfo['index'];

        let typeParam = null;
        if (type === ParamConstant.TYPE_COMMON) {
            typeParam = commonParams;
        }else if (type === ParamConstant.TYPE_PLAYER) {
            typeParam = playerParams;
        }else if (type === ParamConstant.TYPE_PAGE) {
            typeParam = pageParams[id];
            if (!typeParam) {
                typeParam = {};
                pageParams[id] = typeParam;
            }
        }else if (type === ParamConstant.TYPE_LIST) {
            let pathContext = listParams[id];
            if (!pathContext) {
                pathContext = {};
                listParams[id] = pathContext;
            }
            typeParam = pathContext[''+index];
            if (!typeParam) {
                typeParam = {};
                pathContext[''+index] = typeParam;
            }
        }else if (type === ParamConstant.TYPE_CMD) {
            typeParam = cmdParams[id];
            if (!typeParam) {
                typeParam = {};
                cmdParams[id] = typeParam;
            }
        }else if (type === ParamConstant.TYPE_INPUT) {
            typeParam = inputParams[id];
            if (!typeParam) {
                typeParam = {};
                inputParams[id] = typeParam;
            }
        }else throw '增加变量异常!变量类型"'+type+'"无法处理!';

        typeParam[name] = value;
    };

    /**
     * 获取通用页面变量的值
     * @param name 变量名
     * @param listIndex 列表中的位置
     */
    let getContextParam = function (id, name, listIndex) {
        let pageInfo = Slot.getPageInfo(id);
        let pageDef = PageConfig.getPage(pageInfo.path).page;
        let result = null;
        if (name === ParamConstant.CONTEXT_PARAM_TITLE) {
            result = replaceParams(id, pageDef['_title'], listIndex);
        }else if (name === ParamConstant.CONTEXT_PARAM_HAS_CONTEXT) {
            result = !!pageDef['_contextPlugin'];
        }else if (name === ParamConstant.CONTEXT_PARAM_LIST_INDEX) {
            result = listIndex;
        }else if (name === ParamConstant.CONTEXT_PARAM_LIST_INDEX_ADD) {
            result = listIndex+1;
        }else if (name === ParamConstant.CONTEXT_PARAM_LIST_POS) {
            result = listIndex+(pageInfo.page-1)*pageDef['_size'];
        }else if (name === ParamConstant.CONTEXT_PARAM_LIST_POS_ADD) {
            result = listIndex+(pageInfo.page-1)*pageDef['_size']+1;
        }else if (name === ParamConstant.CONTEXT_PARAM_LIST_PAGE) {
            result = pageInfo.page;
        }else if (name === ParamConstant.CONTEXT_PARAM_LIST_PAGE_SIZE) {
            result = pageDef['_size'];
        }else if (name === ParamConstant.CONTEXT_PARAM_LIST_PAGE_AMOUNT) {
            result = getListAmount(id);
        }else if (name === ParamConstant.CONTEXT_PARAM_LIST_PAGE_MAX) {
            let listTotal = pageInfo.listTotal;
            let pageSize = pageDef['_size'];
            if (listTotal && pageSize) result = Common.getMaxPage(listTotal, pageSize);
            else result = 1;
        }else if (name === ParamConstant.CONTEXT_PARAM_LIST_TOTAL) {
            result = pageInfo.listTotal || 0;
        }
        return result;
    };

    /**
     * 获取当前列表项的数量
     * @return {int} 列表项的数量,>=0
     */
    let getListAmount = function (id) {
        let pathParams = listParams[id];
        if (!pathParams) return 0;
        let index=-1;
        while (true) {
            if (!pathParams[''+(++index)]) return index;
        }
    };

    /**
     * 转换管道
     * @param {string} value 变量值
     * @param {Array} pipeList 管道列表
     * @return {string} 转换后的值,不为null可为''
     */
    let convertPipe = function (value, pipeList) {
        if (!value) value = '';

        if (pipeList) {
            pipeList.forEach(pipe => {
                //解析
                let args = Common.split(pipe, '-', 2);
                let plugin = args[0];
                let name = args[1];
                let pluginHandler = pipes[plugin];

                //转换
                if (pluginHandler) {
                    let nameHandler = pluginHandler[name];
                    if (nameHandler) {
                        let result = nameHandler[value];
                        if (result !== undefined) value = result;
                    }
                }
            });
        }
        return (value || '')+'';
    };

    /**
     * 清空指定id指定类型的变量
     * @param types 变量类型
     */
    let clear = function (pageId, ...types) {
        types.forEach(e => {
            if (e === ParamConstant.TYPE_PAGE) {
                delete pageParams[pageId];
            }else if (e === ParamConstant.TYPE_LIST) {
                delete listParams[pageId];
            }else if (e === ParamConstant.TYPE_CMD) {
                delete cmdParams[pageId];
            }else if (e === ParamConstant.TYPE_INPUT) {
                delete inputParams[pageId];
            }else throw '页面类型'+e+'不允许清空!';
        });
    };

    /**
     * 清除指定的玩家变量
     * @param {string} param 变量名
     */
    let clearPlayerParam = param => {
        let value = playerParams[param];
        if (value !== undefined && value !== null) {//的确存在
            //删除变量
            delete playerParams[param];
            //通知改变
            ParamHandler.addChange(null, ParamConstant.TYPE_PLAYER, param);
        }
    };

    /**
     * 清空所有玩家变量
     */
    let clearPlayerParams = () => {
        //先获取全部玩家变量名
        let names = [];
        for (let key in playerParams) {
            if (playerParams.hasOwnProperty(key)) {
                names.push(key);
            }
        }
        //遍历清除
        names.forEach(name => {
            clearPlayerParam(name);
        });
    };

    /**
     * 清空指定id所有变量
     */
    let clearAll = function (pageId) {
        clear(pageId, ParamConstant.TYPE_PAGE, ParamConstant.TYPE_LIST, ParamConstant.TYPE_CMD, ParamConstant.TYPE_INPUT);

        log.info(LogType.DETAIL, "清空页面ID'{0}'相关的所有变量.", pageId);
    };

    //注册包处理器: 管道
    Conn.register(PacketConstant.SERVER5160PIPES, {
        handle: function (data) {
            let plugin = data['plugin'];
            let pipesList = data['pipes'];

            //设置,会覆盖旧值
            pipes[plugin] = pipesList;
        }
    });

    //注册包处理器: 请求变量结果
    Conn.register(PacketConstant.SERVER5200PARAM_RESULT, {
        handle: function (data) {
            //解析
            let id = data['pageId'];
            let path = data['path'];
            let listTotal = data['listTotal'];
            let clearList = data['clearList'];
            let params = data['params'];

            //更新页面信息
            let pageInfo = Slot.getPageInfo(id);
            let oldListTotal = pageInfo.listTotal;
            if (oldListTotal !== listTotal) {
                pageInfo.listTotal = listTotal;
                //通知变量改变
                ParamHandler.addChange(id, ParamConstant.TYPE_CONTEXT, ParamConstant.CONTEXT_PARAM_LIST_PAGE_AMOUNT);
                ParamHandler.addChange(id, ParamConstant.TYPE_CONTEXT, ParamConstant.CONTEXT_PARAM_LIST_PAGE_MAX);
                ParamHandler.addChange(id, ParamConstant.TYPE_CONTEXT, ParamConstant.CONTEXT_PARAM_LIST_TOTAL);
            }

            let listHasChange = false;

            if (clearList) {
                //页面改变
                listHasChange = true;
                //清空
                clear(id, ParamConstant.TYPE_LIST);
                //通知变量改变
                ParamHandler.addChange(id, ParamConstant.TYPE_LIST);
            }

            params.forEach(e => {
                //添加变量
                addParam(id, e);
                //检测页面改变
                if (e.type === ParamConstant.TYPE_LIST) listHasChange = true;
                //小优化: 去冗余
                if (!clearList || e.type !== ParamConstant.TYPE_LIST) {
                    ParamHandler.addChange(id, e.type, e.name);
                }
            });

            //输入变量默认值
            Slot.checkInitDefault(id);

            //检测通知页面改变
            if (listHasChange) ParamHandler.addListChange(id, getListAmount(id));
        }
    });

    return {
        getParams: getParams,
        getLackParams: getLackParams,
        replaceParams: replaceParams,
        setCmdParams: setCmdParams,
        setInputParams: setInputParams,
        setInputParam: setInputParam,
        refreshListParams: refreshListParams,
        requestLackParams: requestLackParams,
        requestParamsForCmd: requestParamsForCmd,
        clearPlayerParams: clearPlayerParams,
        clearAll: clearAll,
        getValue: getValue,
    };
})();