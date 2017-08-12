window.Top = (function () {
    /**
     * 返回
     */
    var back = function() {
        Cmd.execute(false, 'page back');
    };

    /**
     * 主界面
     */
    var main = function() {
        Cmd.execute(false, 'page main');
    };

    /**
     * 刷新
     */
    var refresh = function() {
        Cmd.execute(false, 'page refresh true');
    };

    /**
     * 关闭
     */
    var close = function() {
        Cmd.execute(false, 'slot close');
    };

    return {
        back: back,
        main: main,
        refresh: refresh,
        close: close,
    }
})();