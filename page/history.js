window.History = (function () {
    const HISTORY_MAX_CACHES = 100;

    // /**
    //  * 历史信息
    //  */
    // let History = [{
    //     path: pagePath,
    //     rootCmd: '',
    //     args: args,
    // },];

    let log = new Logger(LogConstant.SOURCE_HISTORY);

    //'格子id:tab位置 历史信息'的映射
    let historys = {};

    /**
     * 添加历史
     */
    let add = (tabPath, tabIndex, history) => {
        let id = tabPath+":"+tabIndex;
        historys[id] = historys[id] || [];
        historys[id].push(history);
        //检测上限
        while (historys[id].length > HISTORY_MAX_CACHES) {
            historys[id].splice(0, 1);
        }
    };

    /**
     * 弹出当前层,返回上一层历史
     * @return {{}|null} 历史或null
     */
    let pop = (tabPath, tabIndex) => {
        let id = tabPath+":"+tabIndex;
        let history = historys[id];
        if (history) {
            if (history.length > 0) {
                //删除当前层
                history.splice(history.length-1, 1);
                //返回上一层
                if (history.length > 0) return history[history.length-1];
            }
        }
        return null;
    };

    /**
     * 检测是否有上一层
     * @return {boolean}
     */
    let hasBack = (tabPath, tabIndex) => {
        let id = tabPath+":"+tabIndex;
        let history = historys[id];
        return history && history.length >= 2;
    };

    /**
     * 清空指定tab路径相关的缓存
     */
    let clear = tabPath => {
        let del = [];

        //找出所有相关历史
        for (let key in historys) {
            if (historys.hasOwnProperty(key)) {
                let args = key.split(':');
                if (args[0] === tabPath) del.push(key);
            }
        }

        //再删除
        del.forEach(key => delete historys[key]);

        //日志
        log.info(LogType.DETAIL, "清空tab路径'{0}'相关历史.", tabPath);
    };

    return {
        add: add,
        pop: pop,
        hasBack: hasBack,
        clear: clear,
    };
})();