(function() {
    Cmd.registerClientHandler(CmdConstant.CMD_EVAL, {
        handle: function(id, arg) {
            //执行js语句
            eval(arg);
        }
    });
})();