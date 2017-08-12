window.Req = (function() {
    var logger = new Logger(LogConstant.SOURCE_REQ);

    // var Handlers = {
    //     plugin: handler(content) {
    //
    //     }
    // };

    var handlers = {};

    /**
     * 注册请求处理器
     * @param plugin 插件
     * @param handler 请求处理器
     */
    var register = function(plugin, handler) {
        //添加缓存
        handlers[plugin] = handler;

        //日志
        logger.info(LogType.FUNC, "注册插件'{0}'的请求处理器!", plugin);
    };

    Conn.register(PacketConstant.SERVER5100REQ_RESULT, {
        handle: function(data) {
            //解析
            var plugin = data.plugin;
            var content = data.content;

            var handler = handlers[plugin];

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