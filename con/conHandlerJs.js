//注册条件处理器: js
Con.register(ConConstant.TYPE_JS, {
    //不需要什么条件变量
    getParams: function(str) {
        return null;
    },
    //直接eval执行来检测
    check: function(value) {
        return !!eval(value)
    }
});