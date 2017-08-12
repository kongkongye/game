window.Store = (() => {
    /**
     * 获取值
     * @param {string} key 键
     * @return {string|null} 不存在返回null
     */
    let get = key => {
        return sessionStorage.getItem(key);
    };

    /**
     * 设置值
     * @param {string} key 键
     * @param {Object|string} value 值,不能为null
     */
    let set = (key, value) => {
        if (typeof value !== 'string') value = JSON.stringify(value);
        sessionStorage.setItem(key, value);
    };

    /**
     * 删除值
     * @param {string} key 键
     * @return 删除的值,可为null
     */
    let del = key => {
        let result = sessionStorage[key];
        delete sessionStorage[key];
        return result;
    };

    return {
        get: get,
        set: set,
        del: del,
    };
})();