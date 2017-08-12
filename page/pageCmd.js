(function () {
    /**
     * 返回
     */
    var back = function() {
        Slot.back();
    }

    /**
     * 主页
     */
    var main = function() {
        Slot.main();
    }

    /**
     * 刷新
     */
    var refresh = function(refreshPage) {
        Slot.refresh(refreshPage);
    }

    /**
     * 打开tab页面
     * @param path 页面路径
     * @param params 变量数组,格式'名=值'
     */
    var join = function (path, params) {
        //转换变量格式,[] => {}
        var args = {};
        for (var i=0;i<params.length;i++) {
            var ss = Common.split(params[i], '=', 2);
            args[ss[0]] = ss[1];
        }
        //显示
        Slot.join(path, args);
    };

    Cmd.registerClientHandler(CmdConstant.CMD_PAGE, {
        handle: function (id, arg) {
            var args = arg.split(' ');
            if (args.length >= 1) {
                if (args[0] === 'back') {
                    back();
                }else if (args[0] === 'main') {
                    main();
                }else if (args[0] === 'refresh') {
                    var refreshPage = false;
                    if (args.length >= 2 && args[1] === 'true') refreshPage = true;
                    refresh(refreshPage);
                }else if (args[0] === 'join') {
                    if (args.length >= 2) {
                        join(args[1], args.slice(2));
                    }
                }
            }
        }
    });
})();