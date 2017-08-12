(function () {
    const MAX_CACHES = 100;
    var shows = [];

    /**
     * 更新面板
     * @param expand 是否扩展
     */
    var update = function(expand) {
        var height;
        if (expand) {
            height = $(window).height()/2;
            if (height > 500) height = 500;
            else if (height < 125) height = 125;

            $('#main-bottom').css('background-color', 'white');
        }else {
            height = $(window).height()/5;
            if (height > 200) height = 200;
            else if (height < 45) height = 45;

            $('#main-bottom').css('background-color', '');
        }
        $('#main-bottom').css('height', height+'px');
        $('#main-bottom-space').css('margin-bottom', (height+15)+'px');
    };

    $(document).ready(function() {
        $('#main-bottom').on('click', function(e) {
            update(true);
            e.stopPropagation();
        });
        $('body').on('click', function() {
            update(false);
        });

        //初始更新
        update(false);
    });

    //默认显示面板
    Show.register("", {
        handle: function (msg) {
            var showBox = $('<div class="show-box"></div>');
            var showBoxTime = $('<div class="show-box-time"><span>'+new Date().format("hh:mm:ss")+'</span></div>');
            showBox.append(showBoxTime);
            var showBoxBody = $('<div class="show-box-body"></div>');
            Color.format(msg).forEach(function(ele) {
                showBoxBody.append(ele);
            });
            showBox.append(showBoxBody);

            //添加缓存
            shows.push(showBox);

            //添加到dom
            $('#main-bottom').prepend(showBox);

            //删除多余缓存
            while (shows.length > MAX_CACHES) {
                var trim = shows.splice(0, 1);
                trim[0].remove();
            }
        }
    });
})();