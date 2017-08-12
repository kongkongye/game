window.Show = (function () {
    // var ShowHandler = {
    //     /**
    //      * 处理显示
    //      * @param msg 信息,不为null可为""
    //      */
    //     handle: function (msg) {
    //     }
    // };

    const log = new Logger(LogConstant.SOURCE_SHOW);

    //type为''表示默认处理器
    const handlers = {};

    /**
     * 注册显示类型处理器
     * @param {string} type 类型
     * @param {object} handler 处理器(看ShowHandler)
     */
    var register = function (type, handler) {
        if (!type) type = '';
        handlers[type] = handler;

        //日志
        if (type) log.info(LogType.FUNC, '注册处理器: {0}', type);
        else log.info(LogType.FUNC, '注册默认处理器');
    };

    /**
     * 获取显示类型处理器
     * @param {string} type 类型
     * @returns {object} 处理器(看ShowHandler)
     */
    var get = function (type) {
        return handlers[type];
    };

    /**
     * 显示
     * @param type ''表示默认显示处理器
     * @param msg 信息
     */
    var show = function(type, msg) {
        //转成不为null的字符串
        if (msg === undefined || msg === null) msg = '';
        else msg = msg+'';

        //获取处理器
        var showHandler = handlers[type];

        //处理器不存在
        if (!showHandler) {
            log.debug(LogType.DETAIL, "未找到类型为'{0}'的显示处理器,使用默认处理器.", type);

            showHandler = handlers[''];
        }

        //处理
        showHandler.handle(msg);
    };

    //注册客户端命令处理器
    Cmd.registerClientHandler(CmdConstant.CMD_SHOW, {
        /**
         * @param arg 参数,格式:
         *            1. 'true 信息'
         *            2. 'false 类型 信息'
         */
        handle: function(id, arg) {
            var type;
            var msg;
            if (arg.split(' ')[0] === 'true') {
                type = '';
                msg = arg.split(' ')[1];
            }else {
                var args = Common.split(arg, ' ', 3);
                type = args[1];
                msg = args[2];
            }

            //显示
            show(type, msg);
        }
    });

    //注册包类型: 显示
    Conn.register(PacketConstant.SERVER5110SHOW, {
        handle: function (data) {
            //解析
            var type = data["type"] || '';
            var msg = data["msg"] || "";

            //显示
            show(type, msg);
        }
    });

    return {
        register: register,
        get: get,
        show: show,
    };
})();