window.PageShow = (function () {
    //图片正则
    const IMAGE_REGEX = /(\[\![^\]]+\])/g;

    var log = new Logger(LogConstant.SOURCE_PAGE);

    /**
     * 获取页面显示
     */
    var getShow = function (id, path, page) {
        var pageDom = $('<div></div>');

        // var Param = {
        //     type: type,
        //     name: name,
        //     handler: function () {
        //     }
        // };

        //上下文
        var context = {
            id: id,
            path: path,
            params: [],
        };

        page['lines'].forEach(function(e) {
            var lineDoms = getVirtualLines(context, e, -1);
            lineDoms.forEach(function(lineDom) {
                pageDom.append(lineDom)
            });
        });

        //变量处理
        ParamHandler.addParams(id, context.params);

        return pageDom;
    };

    /**
     * 获取虚拟行列表
     * @param listIndex 列表位置,从0开始,-1表示无列表
     * @return {Array} 虚拟行列表
     */
    var getVirtualLines = function (context, virtualLine, listIndex) {
        var lineDoms = [];

        var type = virtualLine['type'];
        if (type === 'line') {
            lineDoms.push(getLine(context, virtualLine, listIndex));
        }else if (type === 'br') {
            lineDoms.push(getBr(context, virtualLine, listIndex));
        }else if (type === 'list') {
            lineDoms.push(getList(context, virtualLine, listIndex));
        }else if (type === 'import') {
            lineDoms = lineDoms.concat(getImport(context, virtualLine, listIndex));
        }else throw '行类型"'+type+'"无法处理!';

        return lineDoms;
    };

    /**
     * 获取行
     */
    var getLine = function (context, virtualLine, listIndex) {
        var lineDom = $('<div class="line"></div>');
        var align = virtualLine['_align'];
        if (align) {
            if (align === 'left') lineDom.css('justify-content', 'flex-start');
            else if (align === 'center') lineDom.css('justify-content', 'center');
            else if (align === 'right') lineDom.css('justify-content', 'flex-end');
        }
        virtualLine['components'].forEach(function(component) {
            lineDom.append(getComponent(context, component, listIndex))
        });
        //变量处理器: 条件
        bindConParamHandler(context.id, listIndex, context.params, virtualLine['_con'], lineDom);
        return lineDom;
    };

    /**
     * 获取分隔行
     */
    var getBr = function (context, virtualLine, listIndex) {
        var brDom = $('<div class="separator"></div>');
        //变量处理器: 条件
        bindConParamHandler(context.id, listIndex, context.params, virtualLine['_con'], brDom);
        return brDom;
    };

    /**
     * 获取列表
     * @param listIndex 这里传入的listIndex实际上是不可能发生的,是没有用的(因为一个页面内最多只能有一个列表,而这个就是读取列表)
     */
    var getList = function (context, virtualLine, listIndex) {
        var listDoms = $('<div></div>');
        //重复
        var size = PageConfig.getListSize(context.path);
        for (var index=0;index<size;index++) {
            var index_ = index;
            var listDom = $('<div></div>');
            listDom.hide();
            listDoms.append(listDom);
            virtualLine['lines'].forEach(function(e) {
                getVirtualLines(context, e, index).forEach(function(ee) {
                    listDom.append(ee);
                });
            });
            //添加列表监听
            (function (index_, listDom) {
                ParamHandler.addListListener(context.id, function(listAmount) {
                    if (index_ < listAmount) listDom.show();
                    else listDom.hide();
                });
            })(index_, listDom);
        }
        //变量处理器: 条件
        bindConParamHandler(context.id, listIndex, context.params, virtualLine['_con'], listDoms);
        return listDoms;
    };

    /**
     * 获取导入
     */
    var getImport = function (context, virtualLine, listIndex) {
        var lineDoms = [];

        //读取行
        PageConfig.getLines(virtualLine['_path']).forEach(function(e) {
            lineDoms = lineDoms.concat(getVirtualLines(context, e, listIndex))
        });

        return lineDoms;
    };

    /**
     * 获取组件
     */
    var getComponent = function (context, component, listIndex) {
        var componentDom;
        var type = component['type'];
        if (type === 'text') {
            componentDom = getText(context, component, listIndex);
        }else if (type === 'button') {
            componentDom = getButton(context, component, listIndex);
        }else if (type === 'input') {
            componentDom = getInput(context, component, listIndex);
        }else if (type === 'container') {
            componentDom = getContainer(context, component, listIndex);
        }else throw '组件类型'+type+'无法处理!';

        //style
        var style = component['_style'];
        if (style) componentDom.addClass(style);
        //width
        var width = component['_width'];
        if (width) {
            width = parseInt(width);
            componentDom.css('flex-grow', width);
            componentDom.css('flex-basis', width+"%");
        }
        return componentDom;
    };

    /**
     * 获取容器
     */
    var getContainer = function (context, component, listIndex) {
        var componentDom = $('<div class="component"></div>');
        var align = component['_align'];
        if (align) {
            if (align === 'left') componentDom.css('justify-content', 'flex-start');
            else if (align === 'center') componentDom.css('justify-content', 'center');
            else if (align === 'right') componentDom.css('justify-content', 'flex-end');
            else if (align === 'space-between') componentDom.css('justify-content', 'space-between');
            else if (align === 'space-around') componentDom.css('justify-content', 'space-around');
        }
        component['components'].forEach(function(e) {
            componentDom.append(getComponent(context, e, listIndex))
        });
        return componentDom;
    };

    /**
     * 获取文本
     */
    var getText = function (context, component, listIndex) {
        var textDom = $('<span class="text"></span>');
        var align = component['_align'];
        if (align) textDom.css('text-align', align);
        var content = component['content'];
        if (content) {
            //添加变量处理
            var id = context.id;
            var handler = function() {
                var result = Param.replaceParams(id, content, listIndex);
                //颜色格式
                textDom.empty();
                format(result).forEach(function(ele) {
                    textDom.append(ele)
                });
            };
            Param.getParams(content).forEach(function(e) {
                context.params.push({
                    type: e.type,
                    name: e.name,
                    handler: handler,
                });
            });

            //初始调用
            handler();
        }
        //变量处理器: 条件
        bindConParamHandler(context.id, listIndex, context.params, component['_con'], textDom);
        return textDom;
    };

    /**
     * 获取按钮
     */
    var getButton = function (context, component, listIndex) {
        var id = context.id;
        var buttonDom = $('<button class="btn"></button>');
        //content
        var content = component['content'];
        if (content) {
            //添加变量处理
            var handler = function() {
                //转换变量
                var result = Param.replaceParams(id, content, listIndex);
                //颜色格式
                buttonDom.empty();
                format(result).forEach(function(ele) {
                    buttonDom.append(ele)
                });
            };
            Param.getParams(content).forEach(function(e) {
                context.params.push({
                    type: e.type,
                    name: e.name,
                    handler: handler,
                });
            });

            //初始调用
            handler();
        }
        //mode
        var mode = component['_mode'];
        //事件
        var prompt = component['_cmd'].substr(0, 1);//命令提示符
        var server;
        if (prompt === '/') server = true;//服务端命令
        else if (prompt === '$') server = false;//客户端命令
        else log.warn(LogType.DETAIL, "命令'{0}'没有提示符,无法识别是服务端或客户端命令!", component['_cmd']);
        var cmd = component['_cmd'].substr(1);
        buttonDom.on('click', function () {
            //变量不全
            var needParams = Param.getParams(cmd);
            for (var i=0;i<needParams.length;i++) {
                if (Param.getValue(id, needParams[i].type, needParams[i].name, listIndex) === null) {
                    Show.show('', '#g缺少变量!');
                    return;
                }
            }
            //转换变量
            var cmdResult = Param.replaceParams(id, cmd, listIndex);
            Cmd.execute(server, cmdResult, id, mode === 'refresh');
        });
        //变量处理器: 条件
        bindConParamHandler(context.id, listIndex, context.params, component['_con'], buttonDom);
        return buttonDom;
    };

    /**
     * 获取输入
     */
    var getInput = function (context, component, listIndex) {
        //multi
        var multi = component['_multi'];
        //构建dom
        var inputDom = multi?$('<textarea class="input input-area"></textarea>'):$('<input class="input"/>');
        //type
        if (!multi) {
            var type = component['_type'];
            if (type) inputDom.attr('type', type);
        }
        //description
        var description = component['_description'];
        if (description) {
            //添加变量处理
            var id = context.id;
            var handler = function() {
                var result = Param.replaceParams(id, description, listIndex);
                inputDom.attr('title', result);
                inputDom.attr('placeholder', result);
            };
            Param.getParams(description).forEach(function(e) {
                context.params.push({
                    type: e.type,
                    name: e.name,
                    handler: handler,
                });
            });

            //初始调用
            handler();
        }
        //fix-width
        var fixWidth = component['_fix-width'];
        if (fixWidth) {
            inputDom.css('width', fixWidth+'rem');
        }
        //初始值
        var initValue = Param.getValue(context.id, ParamConstant.TYPE_INPUT, component['_name'], listIndex);
        if (initValue === null && component['_default']) {
            //转换变量
            initValue = Param.replaceParams(context.id, component['_default'], listIndex);
        }
        if (initValue !== null) {
            Param.setInputParam(context.id, component['_name'], initValue);
            inputDom.val(initValue);
        }
        //事件
        inputDom.on('blur', function () {
            Param.setInputParam(context.id, component['_name'], $(inputDom).val());
        });
        inputDom.on('keyup', function() {
            Param.setInputParam(context.id, component['_name'], $(inputDom).val())
        });
        //变量处理器: 条件
        bindConParamHandler(context.id, listIndex, context.params, component['_con'], inputDom);
        return inputDom;
    };

    /**
     * 绑定变量处理器: 条件
     * @param con 条件(未转换的)(会判断条件有没值,如果没值就不会绑定)
     * @param dom 如果条件不满足,将此dom显示设置为无
     */
    var bindConParamHandler = function(id, listIndex, params, con, dom) {
        if (con) {
            //处理器
            var handler = function() {
                var resultCon = Param.replaceParams(id, con, listIndex);
                if (Con.check(resultCon)) dom.css('display', '');
                else dom.css('display', 'none');
            };

            //变量
            Param.getParams(con).forEach(function(e) {
                params.push({
                    type: e.type,
                    name: e.name,
                    handler: handler,
                });
            });
            //条件变量
            Con.addParams(id, con, handler);

            //初始调用
            handler();
        }
    };

    /**
     * 格式化
     * @param str 字符串(可能包含图像与颜色)
     * @return {Array} jq元素数组
     */
    var format = function(str) {
        var result = [];

        var args = str.split(IMAGE_REGEX);
        for (var i in args) {
            if (args.hasOwnProperty(i)) {
                var arg = args[i];
                if (arg.length > 3 && arg.match(IMAGE_REGEX)) {//图片
                    var url = arg.substr(2, arg.length-3);
                    handleImg(result, url);
                }else {//文字
                    handleText(result, arg);
                }
            }
        }

        return result;
    };

    var handleImg = function(result, url) {
        var img = $("<img class='img' src='"+url+"'/>");
        result.push(img);
    };

    var handleText = function(result, text) {
        Color.format(text).forEach(function(ele) {
            result.push(ele)
        });
    };

    return {
        getShow: getShow
    };
})();