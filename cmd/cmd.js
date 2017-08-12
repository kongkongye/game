window.Cmd = (function () {
    let log = new Logger(LogConstant.SOURCE_CMD);

    // /**
    //  * 客户端命令处理器
    //  */
    // let ClientHandler = {
    //     //id可能为null
    //     handle: function (id, arg) {
    //
    //     }
    // };

    //命令名 命令处理器
    let clientHandlers = {};

    //缓存的客户端命令列表(连接load阶段会缓存)
    let waiting;

    /**
     * 注册客户端处理器
     * @param cmdName 命令名
     * @param clientHandler 客户端处理器
     */
    let registerClientHandler = function (cmdName, clientHandler) {
        clientHandlers[cmdName] = clientHandler;

        //日志
        log.info(LogType.FUNC, '注册客户端命令处理器: {0}', cmdName);
    };

    /**
     * 执行命令
     * @param server 是否是服务端命令
     * @param cmd 命令内容
     * @param id 页面id,可选,默认无
     * @param refresh 执行成功后是否刷新变量,只对服务端命令有效
     */
    let execute = function (server, cmd, id, refresh) {
        //先切换格子
        if (id) {
            Slot.selSlotByPageId(id);
        }

        //命令没有实际内容
        if (!cmd || cmd.length <= 1) return;

        if (server) {//服务端命令
            //日志
            log.info(LogType.OPERATE, '执行服务端命令: {0}', cmd);

            //发送命令
            requestCmd(cmd, refresh);
        }else {//客户端命令
            if (Conn.getPhase() === ConnConstant.PHASE_LOAD) {//连接load阶段
                if (!waiting) waiting = [];
                waiting.push({
                    cmd: cmd,
                    id: id,
                });
            }else {//非load阶段: 直接执行
                //日志
                log.info(LogType.OPERATE, '执行客户端命令: {0}', cmd);

                let args = Common.split(cmd, ' ', 2);
                let cmdName = args[0];
                let clientHandler = clientHandlers[cmdName];
                if (clientHandler) {
                    //处理
                    clientHandler.handle(id, args[1]);
                }else {
                    log.warn(LogType.DETAIL, "客户端命令'{0}'未找到处理器!", cmdName);
                }
            }
        }
    };

    /**
     * (向服务器)发送命令
     */
    let requestCmd = function (cmd, refresh) {
        Conn.send(PacketConstant.CLIENT120CMD, {
            cmd: cmd,
        }, true).then((e) => {
            let data = e.data;
            let success = data.success;
            if (success) {
                log.debug(LogType.DETAIL, '服务端命令执行成功: {0}', cmd);
                if (refresh) Cmd.execute(false, 'page refresh');
            }else {
                log.debug(LogType.DETAIL, '服务端命令执行失败: {0}', cmd);
            }
        });
    };

    //注册包处理器: 客户端命令
    Conn.register(PacketConstant.SERVER5120CMD_CLIENT, {
        handle: data => {
            let cmd = data.cmd;
            execute(false, cmd);
        }
    });

    //检测执行所有客户端指令
    setInterval(() => {
        if (waiting) {
            //日志
            log.info(LogType.DETAIL, '开始执行所有等待的命令...');
            //执行所有等待的命令
            waiting.forEach(info => execute(false, info.cmd, info.id));
            //设置等待的命令为null
            waiting = null;
        }
    }, 50);

    return {
        registerClientHandler: registerClientHandler,
        execute: execute,
    };
})();