window.Splitor = function (content) {
    //普通文本开始的位置,-1表示未开始
    let textIndex = -1;
    //当前位置
    let index = -1;

    //固化信息(颜色&格式&换行)
    //颜色
    let color = '';
    //格式
    let formats = '';

    let result = [];

    /**
     * 检测加上前面的普通文本
     * @param end 最后位置(包含)
     */
    let addPreText = function (end) {
        //前面没有普通文本,直接返回
        if (textIndex === -1) return;

        //信息
        let info = {
            color: ''
        };

        //颜色格式
        //先加颜色
        if (color) {
            //添加
            info['color'] += ColorConstant.CHAR+color;
        }
        //再加格式
        if (formats) {
            //添加
            formats.split('').forEach(format => info['color'] += ColorConstant.CHAR+format);
        }

        //普通字符
        info['str'] = content.substr(textIndex, end+1-textIndex);

        //更新值
        textIndex = -1;

        //添加进结果数组
        result.push(info);
    };

    /**
     * 执行分割
     * @return {Array} 信息列表
     */
    this.split = function () {
        while (true) {
            //后面已经没有内容
            if (index >= content.length-1) {
                addPreText(index);
                return result;
            }

            //移动
            index++;

            //固化
            let c = content.charAt(index);
            if (Color.isChar(c)) {//颜色字符开头,可能是颜色或格式
                //后面已经没有内容
                if (index >= content.length-1) {
                    addPreText(index);
                    return result;
                }

                //下个字符
                let c2 = content.charAt(++index);
                //是颜色
                if (Color.isColor(c2)) {//特点: 颜色不能累积,且会清除格式
                    //先检测前面的普通文本加上
                    addPreText(index-2);
                    //再更新
                    color = c2;
                    formats = '';
                    continue;
                }
                //是格式
                if (Color.isFormat(c2)) {//特点: 不影响颜色,且不同格式可以累积
                    //先检测前面的普通文本加上
                    addPreText(index-2);
                    //再更新
                    if (formats.indexOf(c2) === -1) {//没有才加上
                        formats += c2;
                    }
                    continue;
                }
                //是换行
                if (Color.isBr(c2)) {//特点: 会清除颜色格式
                    //先检测前面的普通文本加上
                    addPreText(index-2);
                    //再添加进结果
                    result.push({
                        br: true,
                    });
                    //再更新
                    color = '';
                    formats = '';
                    continue;
                }
                //是普通字符
                //如果之前都是颜色字符,这时设置一下
                if (textIndex === -1) {
                    textIndex = index-1;//注意减1
                }
            }else {
                //普通字符

                //如果之前都是颜色字符,这时设置一下
                if (textIndex === -1) {
                    textIndex = index;
                }
            }
        }
    };
};