window.Conn = (function () {
    // /**
    //  * 包处理器
    //  */
    // var PacketHandler = {
    //     /**
    //      * 处理数据
    //      * @param {object} data 数据
    //      */
    //     handle: function (data) {
    //     }
    // };

    var log = new Logger(LogConstant.SOURCE_CONN);

    //所有的包处理器
    var handlers = {};

    // var data = {
    //     data: data,    //包数据
    //     id: id,        //id
    //     reqId: reqId   //请求id
    // };

    // //请求信息
    // var Req = {
    //     promise: promise,    //回调
    //     time: 111            //发送时间点
    // };

    //'请求id 请求信息'的映射
    var reqs = {};

    //阶段
    var phase = ConnConstant.PHASE_LOAD;

    /**
     * 获取当前阶段
     */
    var getPhase = function() {
        return phase;
    };

    /**
     * 连接
     */
    var connect = function () {
        log.info(LogType.DETAIL, "开始连接...");

        //代理给连接处理器处理
        Ws.connect().then(function () {
            log.info(LogType.DETAIL, "连接成功!");
        }, function () {
            log.info(LogType.DETAIL, "连接失败!");
        });
    };

    /**
     * 断开连接
     */
    var disconnect = function () {
        log.info(LogType.DETAIL, "断开连接!");

        //代理给连接处理器处理
        Ws.disconnect();
    };

    /**
     * 发送包
     * @param id 包id
     * @param {object} data 数据(类型格式)
     * @param hasCallback 是否有回调方法,如果有,则返回的包则会被此回调处理,否则会被注册的处理器处理
     * @return 如果有回调则返回promise
     */
    var send = function (id, data, hasCallback) {
        var promise = null;
        var reqId = 0;
        if (hasCallback) {
            promise = $.Deferred();
            reqId = Common.getRandomLong();
            reqs[reqId] = {
                promise: promise,
                time: new Date().getTime(),
            };
        }
        Ws.send({
            id: id,
            reqId: reqId,
            data: data
        });
        // log.debug(">>>"+packet);
        return promise;
    };

    /**
     * 注册包处理器
     * @param {int} id 包类型
     * @param {object} handler 处理器(看PacketHandler)
     */
    var register = function (id, handler) {
        handlers["ID"+id] = handler;
    };

    /**
     * 接收到包时调用
     * @param {string|Object} msg 信息
     */
    var onReceive = function (msg) {
        //日志
        // log.debug('<<< ', msg);

        //解析
        var json;
        if (typeof msg === 'string') json = JSON.parse(msg);
        else json = msg;
        var id = json["id"];
        var reqId = json['reqId'];
        var data = json["data"];

        if (reqId !== 0) {
            var reqInfo = reqs[reqId];
            delete reqs[reqId];//删除缓存
            if (reqInfo) {
                reqInfo.promise.resolve({
                    data: data,
                    id: id,
                    reqId: reqId
                });
            }else {
                log.debug(LogType.DETAIL, "响应超时!包ID: {0} 请求ID: {1}", id, reqId);
            }
        }else {
            //获取处理器
            var handler = handlers["ID"+id];

            //处理器不存在
            if (!handler) {
                log.warn(LogType.DETAIL, "未找到ID为'{0}'的处理器", id);
                return;
            }

            //处理
            handler.handle(data);
        }
    };

    //注册包处理器: 修改连接阶段
    register(PacketConstant.SERVER5300CONN_PHASE, {
        handle: function(data) {
            //解析
            var tarPhase = data.phase;

            //验证与修改阶段
            if (tarPhase === ConnConstant.PHASE_START) {
                if (phase === ConnConstant.PHASE_LOAD) {
                    //更新
                    phase = tarPhase;
                    //日志
                    log.info(LogType.DETAIL, "连接阶段更新为: {0}", phase);
                }else {
                    log.warn(LogType.DETAIL, "异常!连接阶段无法从'{0}'更新为'{1}'", phase, tarPhase);
                }
            }else {//无法处理
                log.warn(LogType.DETAIL, "异常!目标连接阶段'{0}'目标无法处理!", tarPhase);
            }
        }
    });

    //检测删除超时请求
    setInterval(function () {
        var resultReqs = {};
        var now = new Date().getTime();
        for (var reqId in reqs) {
            if (reqs.hasOwnProperty(reqId)) {
                var reqInfo = reqs[reqId];
                if (now <= reqInfo.time+ConnConstant.CALLBACK_TIMEOUT) {
                    resultReqs[reqId] = reqInfo;
                }else {
                    //reject
                    reqInfo.promise.reject('请求超时!');
                    //日志
                    log.debug(LogType.DETAIL, "ID为'{0}'的请求超时!", reqId);
                }
            }
        }
        reqs = resultReqs;
    }, 1000);

    return {
        getPhase: getPhase,
        connect: connect,
        disconnect: disconnect,
        send: send,
        register: register,
        onReceive: onReceive,
    }
})();