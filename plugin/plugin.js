window.Plugin = (() => {
    Conn.register(PacketConstant.SERVER5130PLUGIN, {
        handle: data => {
            //解析
            let name = data.name;
            let content = data.content;

            //执行插件内容
            eval(content);
        }
    });
})();