/**
 * 条件格式: '类型:值'
 */
window.Con = (() => {
    let log = new Logger(LogConstant.SOURCE_CON);

    // let Handler = {
    //     //获取全部条件变量(返回string),可为null
    //     getParams: str => {
    //         return ['name1', 'name2', ];
    //     },
    //
    //     //检测条件
    //     check: per => {},
    // };

    //类型 处理器
    let handlers = {};

    /**
     * 注册条件处理器
     * @param {string} type 类型
     * @param {Function} handler 处理器
     */
    let register = (type, handler) => {
        handlers[type] = handler;

        //日志
        log.info(LogType.FUNC, "注册条件处理器,类型: {0}", type);
    };

    /**
     * 检测条件
     * @param con 条件
     * @return {boolean} 是否满足
     */
    let check = con => {
        //解析
        let info = parse(con);
        if (!info) return false;

        //返回检测结果
        try {
            return !!info.handler.check(info.value);
        }catch (e) {
            return false;
        }
    };

    /**
     * 添加变量
     * @param con
     */
    let addParams = (pageId, con, handler) => {
        //解析
        let info = parse(con);
        if (!info) return false;

        let params = info.handler.getParams(info.value);
        if (!params) params = [];
        params.forEach(param => ParamHandler.addConListener(pageId, handler.type, param, handler));
    };

    /**
     * 解析条件
     * @return 解析出的条件信息,null表示解析失败
     */
    let parse = con => {
        let args = Common.split(con, ':', 2);

        //条件值格式错误
        if (args.length !== 2) {
            log.warn(LogType.DETAIL, "条件值'{0}'格式错误!", con);
            return null;
        }

        //解析
        let type = args[0];
        let value = args[1];
        let handler = handlers[type];

        //条件处理器不存在
        if (!handler) {
            log.warn(LogType.DETAIL, "条件处理器'{0}'不存在!", type);
            return null;
        }

        return {
            type: type,
            value: value,
            handler: handler,
        };
    };

    return {
        register: register,
        check: check,
        addParams: addParams,
    };
})();