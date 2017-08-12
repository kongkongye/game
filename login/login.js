window.Login = (function () {
    let player = {};

    /**
     * 获取玩家
     * @return 不为null
     */
    let getPlayer = () => player;

    /**
     * 检测是否登录
     */
    let hasLogin = () => !!player.name;

    /**
     * 登录成功时调用
     */
    let setLogin = function (name, nick) {
        player.name = name;
        player.nick = nick;
    };

    /**
     * 登出时调用
     */
    let clearLogin = () => {
        delete player.name;
        delete player.nick;

        //删除所有玩家相关变量
        Param.clearPlayerParams();
    };

    //注册客户端命令处理器: 登录
    Cmd.registerClientHandler(CmdConstant.CMD_LOGIN, {
        handle: (id, arg)=> {
            let args = arg.split(' ');
            if (args[0] === 'set') {
                setLogin(args[1], args[2]);
            }else if (args[0] === 'clear') {
                clearLogin();
            }
        }
    });

    return {
        getPlayer: getPlayer,
        hasLogin: hasLogin,
    };
})();