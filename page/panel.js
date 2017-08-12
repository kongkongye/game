window.Panel = (function() {
    var log = new Logger(LogConstant.SOURCE_PANEL);

    // var Panels = {
    //     id: {              //面板ID
    //         width: '25%',  //显示的宽度(css宽度的值)
    //         dom: panelDom, //面板的dom(网页前端设置)
    //     },
    // };

    var panels = {};

    /**
     * 检测指定id的面板是否存在
     */
    var hasPanel = function(panelId) {
        return !!panels[panelId];
    }

    /**
     * 添加格子dom
     * (请先确保面板存在)
     */
    var addSlot = function(panelId, slotDom) {
        //添加
        panels[panelId].dom.append(slotDom);
    };

    /**
     * 设置面板
     */
    var setPanels = function(panelDefs) {
        for (var i=0;i<panelDefs.length;i++) {
            var panelDef = panelDefs[i];
            if ($(window).width() >= panelDef.width) {
                for (var id in panelDef.panels) {
                    if (panelDef.panels.hasOwnProperty(id)) {
                        //日志
                        log.info(LogType.FUNC, "启用面板: {0}", id);

                        var container = $('<div class="slots-container"></div>');
                        container.css('width', panelDef.panels[id]);
                        var slot = $('<div class="slots"></div>');
                        slot.attr('slots-'+id);
                        container.append(slot);

                        //添加到dom
                        $('#slots-div').append(container);

                        //更新缓存
                        panels[id] = {
                            width: panelDef.panels[id],
                            dom: slot,
                        };
                    }
                }
                break;
            }
        }
    };

    Conn.register(PacketConstant.SERVER5150PANELS, {
        handle: function(data) {
            //解析
            var panels = data['panels'];

            //设置面板
            setPanels(panels);
        }
    });

    return {
        addSlot: addSlot,
        hasPanel: hasPanel,
    };
})();