(() => {
    Cmd.registerClientHandler(CmdConstant.CMD_EVAL, {
        handle: (id, arg) => eval(arg),//执行js语句
    });
})();