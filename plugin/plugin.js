window.Plugin = (function() {
    Conn.register(PacketConstant.SERVER5130PLUGIN, {
        handle: function(data) {
            //解析
            var name = data.name;
            var content = data.content;

            //执行插件内容
            eval(content);
        }
    });
})();