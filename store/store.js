window.Store = (function() {
    /**
     * 获取值
     * @param {string} key 键
     * @return {string|null} 不存在返回null
     */
    var get = function(key) {
        return sessionStorage.getItem(key);
    };

    /**
     * 设置值
     * @param {string} key 键
     * @param {Object|string} value 值,不能为null
     */
    var set = function(key, value) {
        if (typeof value !== 'string') value = JSON.stringify(value);
        sessionStorage.setItem(key, value);
    };

    /**
     * 删除值
     * @param {string} key 键
     * @return 删除的值,可为null
     */
    var del = function(key) {
        var result = sessionStorage[key];
        delete sessionStorage[key];
        return result;
    };

    return {
        get: get,
        set: set,
        del: del,
    };
})();