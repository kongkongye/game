window.Top = (function () {
    /**
     * 返回
     */
    let back = () => Cmd.execute(false, 'page back');

    /**
     * 主界面
     */
    let main = () => Cmd.execute(false, 'page main');

    /**
     * 刷新
     */
    let refresh = () => Cmd.execute(false, 'page refresh true');

    /**
     * 关闭
     */
    let close = () => Cmd.execute(false, 'slot close');

    return {
        back: back,
        main: main,
        refresh: refresh,
        close: close,
    }
})();