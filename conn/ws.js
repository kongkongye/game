//连接的ws实现
let Ws = (function () {
    let log = new Logger(LogConstant.SOURCE_CONN);

    let client;

    /**
     * 是否已连接
     */
    let isConnected = function () {
        return client && client.readyState === 1;
    };

    /**
     * 连接
     * @return promise
     */
    let connect = function () {
        let promise = $.Deferred();

        //新建连接
        client = new WebSocket(ConnConstant.URL);

        //连接成功
        client.onopen = function () {
            promise.resolve();

            //收到信息
            client.onmessage = function (event) {
                Conn.onReceive(event.data);
            };

            //连接出错
            client.onerror = function (event) {
                console.log(arguments)

            };

            //连接关闭
            client.onclose = function (event) {
                client = null;

                //幕布
                let mask = $("<div class='mask'></div>");
                $('body').append(mask);
                let maskText = $("<div class='mask-text'><button class='btn' onclick='window.location.reload()'>刷新</button></div>");
                $('body').append(maskText);

                //提示
                Show.show('', '#g连接关闭: '+event.reason);

                //关闭原因
                log.warn(LogType.DETAIL, event.reason);
            }
        };
        //连接失败
        client.onclose = function () {
            client = null;

            promise.reject();
        };

        return promise;
    };

    /**
     * 断开连接
     */
    let disconnect = function () {
        client.close();
        client = null;
    };

    /**
     * 发送数据(连接已断开则不会发送)
     * @param {Object} data 数据(包格式)
     */
    let send = function (data) {
        if (isConnected()) {
            //格式化
            formatJson(data);
            //发送
            client.send(JSON.stringify(data));
        }else {
            log.warn(LogType.DETAIL, '连接已经关闭,无法发送数据!');
        }
    };

    /**
     * 格式化json
     */
    let formatJson = json => {
        for (let key in json) {
            if (json.hasOwnProperty(key)) {
                let value = json[key];
                let type = typeof value;
                if (type === 'object') {
                    formatJson(value);
                }else if (type === 'string') {
                    json[key] = value.replace(/{/g, '\u0000');
                }
            }
        }
    };

    return {
        isConnected: isConnected,
        connect: connect,
        disconnect: disconnect,
        send: send,
    };
})();