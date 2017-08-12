window.Req = (() => {
    let logger = new Logger(LogConstant.SOURCE_REQ);

    // let Handlers = {
    //     plugin: handler(content) {
    //
    //     }
    // };

    let handlers = {};

    /**
     * 注册请求处理器
     * @param plugin 插件
     * @param handler 请求处理器
     */
    let register = (plugin, handler) => {
        //添加缓存
        handlers[plugin] = handler;

        //日志
        logger.info(LogType.FUNC, "注册插件'{0}'的请求处理器!", plugin);
    };

    Conn.register(PacketConstant.SERVER5100REQ_RESULT, {
        handle: data => {
            //解析
            let plugin = data.plugin;
            let content = data.content;

            let handler = handlers[plugin];

            //请求处理器未找到
            if (!handler) {
                logger.warn(LogType.DETAIL, "插件'{0}'未注册请求处理器!", plugin);
                return;
            }

            //处理
            handler(content);
        }
    });

    return {
        register: register,
    };
})();