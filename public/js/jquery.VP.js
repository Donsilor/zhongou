/**
 * VP 
 */
(function ($) {
    //继承
    var F2xExtend = __extends;

    /**
     * VP
     */
    $.fn.VP = function (options) {

        var s = this;
        //随机生成的VP标识ID
        var id = "VP_" + new Date().getTime() + Math.floor(Math.random()*10000);

        //尺寸
        var viewSize = {
            width: 0,
            height: 0
        };
        //loading
        var vLoading;
        //debug
        var vDebug;

        //画布
        var stage;
        //面板（有多种类型）
        var view;
		
		//缩放模式
		var scaleModeList = [
			"noBorder","showAll","fixedWidth","fixedHeight","exactfit"
		]
	
        //默认参数
        var _setting = {
            debug: false, 				//是否debug debug会有debug面板查看进度
            loop: false, 				//是否循环
            autoPlay: false, 			//是否自动播放
            total: 0, 					//图片总数
            time: 0, 					//播放时长
            audio: "", 					//音频文件路径
            path: "", 					//图片路径
            type: "jpg", 				//图片后缀 jpg or png
            loading: null, 				//一个JQloading对象 替代默认的vLoading
							            //播放类型 
							            //1 默认图片序列帧
							            //2 带音频的（如果检查木有音频自动用1类型）
            mode: 1,
            scaleMode: "noBorder",		//缩放模式
            onInit: function(){},		//初始化好回调
            onLoaded: function(){},		//素材加载完成回调
            onPlay: function(){},   	//开始播放回调
            onPause: function(){},  	//暂停播放回调
            onEnd: function(){},     	//结束播放回调
            onFrame: function(){}		//播放中每帧回调
            
        };
        $.extend(true, _setting, options);

        function init() {
            initData();
            initUI();
            addEvent();
        }
        //初始化数据
        function initData() {
            viewSize.width = s.outerWidth();
            viewSize.height = s.outerHeight();
        }
        //初始化UI
        function initUI() {
            //添加wrap 和 loading
            var div = $('<div id = "' + id + '"></div>').appendTo(s);
            vLoading = $('<div class = "vLoading"><span><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>').appendTo(s);
            if(_setting.loading){
            	vLoading = _setting.loading;
            }
            vLoading.hide();

            var divW = viewSize.width;
            var diwH = viewSize.height;
            div.css({
                width: divW,
                height: diwH,
                position: "relative",
                overflow: "hidden"
            });

            //生成canvas
            stage = new annie.Stage(id, divW, diwH, 60, annie.StageScaleMode.NO_BORDER, 0);
            stage.addEventListener(annie.Event.INIT_TO_STAGE, function (e) {
                initView();
            });
			//debug模式显示debug
            if (_setting.debug) {
                vDebug = $('<div></div>').css({
                    position: "absolute",
                    left: 0,
                    top: "0.5rem",
                    padding: "0.1rem",
                    background: "#fff",
                    color: "#000"
                }).html('debug').appendTo(div);
            }
        }
        //注册事件
        function addEvent() {
            globalDispatcher.addEventListener(id + "debug", _debug);
            globalDispatcher.addEventListener(id + "play", _play);
            globalDispatcher.addEventListener(id + "pause", _pause);
            globalDispatcher.addEventListener(id + "end", _end);
            globalDispatcher.addEventListener(id + "loading", _loading);
            if (s.find('.close').length > 0) {
                s.find('.close').one('click', function () {
                    view.destroy();
                });
            }
        }
        //这是全局事件
        function _debug(e){
            updateDebug(e.data);
        }
        function _play(e){
            _setting.onPlay();
        }
        function _pause(e){
            _setting.onPause();
        }
        function _end(e){
        	vLoading.hide();
            _setting.onEnd();
        }
        function _loading(e){
            if(e.data){
                vLoading.show()
            }else{
                vLoading.hide();
            }
        }
        //移除事件
        function removeEvent() {
            globalDispatcher.removeEventListener(id + "debug", _debug);
            globalDispatcher.removeEventListener(id + "play", _play);
            globalDispatcher.removeEventListener(id + "pause", _pause);
            globalDispatcher.removeEventListener(id + "end", _end);
            globalDispatcher.removeEventListener(id + "loading", _loading);
            if (s.find('.close').length > 0) {
                s.find('.close').off('click');
            }
            stage.kill();
        }
        //初始化UI 目前有两种模式 
        //无声和有声
        function initView() {
            switch (_setting.mode) {
                case 1:
                    view = new frameView.FrameView(_setting);
//                  vLoading.show();
                    break;
                case 2:
                    view = new audioFrameView.AudioFrameView(_setting);
//                  vLoading.show();
                    break;

                default:
                    break;
            }
            s.view = view;
            view.id = id;
            view.viewSize = viewSize;
            stage.addChild(view);
            view.parse(function () {
            	_setting.onInit();
                if (_setting.autoPlay) {
                    view.play();
                }
            });
        }

        function updateDebug(value) {
            if (vDebug) {
                vDebug.html(value);
            }
        }

        //======================================================
	
		//播放
        s.play = function (value) {
        	value = value || 0;
            view.play(value);
        }
        s.gotoAndStop = function(value){
        	value = value || 0;
            view.gotoAndStop(value);
        }
        //暂停
        s.pause = function(){
        	view.pause();
        }
        /**
         * 设置缩放模式
         * @param {string} value  "noBorder","showAll","fixedWidth","fixedHeight"
         * */
        s.scaleMode = function(value){
        	if(_setting.scaleMode != value){
        		var index = scaleModeList.indexOf(value);
        		if(index == -1){
        			console.warn("缩放模式:" + value + "不存在");
        		}else{
        			_setting.scaleMode = value;
        			view.isResize = false;
        			view.resize();
        		}
        		
        	}
        	
        }
        /**
         * 音量大小，从0-1 在ios里 volume只能是0 或者1，其他无效
         * */
        s.volume = function(value){
        	if(_setting.mode == 2){
        		view.volume(value);
        	}
        }
        s.muted = function(muted){
        	if(_setting.mode == 2){
        		view.muted(muted);
        	}
        }
        s.loadImg = function(){
        	view.loadImgs();
        }
        //销毁
        s.destroy = function () {
            if (view) {
                removeEvent();
                view.destroy();
                view = null;
            }
        }

        //======================================================
        init();

        return s;

    }

    //image loader
    var ImageLoader = function (id, url, callback) {
        var s = this;
        var loader = null;
        var img;
        s.id = id;
        s.type = "load";
        img = s.img = new Image();

        var onLoad = function () {
            callback(s);
            cleanup();
        };

        var onError = function () {
            callback(s, 'on error');
            cleanup();
        };

        var cleanup = function () {
            s.unbind('load', onLoad);
            s.unbind('error', onError);
        };

        s.start = function () {
            s.bind('load', onLoad);
            s.bind('error', onError);
            s.img.src = url;
            if (img.complete || img.readyState == "complete" || img.readyState == "loaded") {
                s.type = "cache";
                onLoad();
            }
        }
        s.bind = function (eventName, eventHandler) {
            s.img.addEventListener(eventName, eventHandler, false);
        };
        s.unbind = function (eventName, eventHandler) {
            s.img.removeEventListener(eventName, eventHandler, false);
        };
    }

    /**
     * baseView显示基类
     */
    var baseView = baseView || {};
    baseView.BaseView = function () {
        var s = this;
        s.isResize = false;
        s.ui = null;
        s.isDestroy = false;
        F2xContainer.call(s);
        s.initUI();
    }
    F2xExtend(baseView.BaseView, F2xContainer);
    //ui初始化
    baseView.BaseView.prototype.initUI = function () {
        var s = this;
        s.ui = new annie.Bitmap();
        s.addChild(s.ui);
    }
    //重置图片尺寸
    baseView.BaseView.prototype.resize = function (w, h) {
        var s = this;
        if (s.stage && !s.isResize) {
            s.isResize = true;
            w = w || s.fW;
            h = h || s.fH;
//          if (window.innerWidth == s.viewSize.width && window.innerHeight == s.viewSize.height) {
                var scaleX = scaleY = 0;
                var sW = s.viewSize.width;
                var sH = s.viewSize.height;
                var vW = w;
                var vH = h;
                scaleX = sW / vW;
                scaleY = sH / vH;
                switch (s.options.scaleMode){
                	case 'noBorder':
                		if (scaleX > scaleY) {
                            scaleY = scaleX;
                        }
                        else {
                            scaleX = scaleY;
                        }
                		break;
                	case "showAll":
                        if (scaleX < scaleY) {
                            scaleY = scaleX;
                        }
                        else {
                            scaleX = scaleY;
                        }
                        break;
                    case "fixedWidth":
                        scaleY = scaleX;
                        break;
                    case "fixedHeight":
                        scaleX = scaleY;
                        break;
                    case "exactfit":
                        
                        break;
                	default:
                		break;
                }
                s.ui.scaleX = scaleX;
                s.ui.scaleY = scaleY;
                s.ui.x = (sW - s.ui.width) * 0.5;
                // s.ui.y = (sH - s.ui.height) * 0.5;
//          } else {
//              s.ui.width = s.viewSize.width;
//              s.ui.height = s.viewSize.height;
//          }
        }
    }
    //更新图片资源
    baseView.BaseView.prototype.updateView = function (value) {
        var s = this;
        s.ui.bitmapData = value;
    }
    //下面的方法是给子类继承的
    baseView.BaseView.prototype.parse = function () {}
    baseView.BaseView.prototype.play = function () {}
    baseView.BaseView.prototype.pause = function () {}
    baseView.BaseView.prototype.stop = function () {}
    baseView.BaseView.prototype.gotoAndStop = function () {}
    baseView.BaseView.prototype.destroy = function () {
        var s = this;
        s.isDestroy = true;
    }

    /**
     * frameView 序列帧
     */
    var frameView = frameView || {};
    frameView.FrameView = function (options) {
        var s = this;
        s.options = options;
        //是否播放
        s.isPlay = false;
        //是否在加载素材
        s.isLoad = false;
        //是否loading中
        s.loading = 0;
        //当前加载总进度
        s.loaded = 0;
        //缓存数据
        s.cache = [];
        //time
        s.timeid = null;
        //速度 根据total和time计算出来的
        s.speed = 10;
        //当前第几张
        s.index = 0;
        //序列总长度
        s.total = 0;
        baseView.BaseView.call(s);
    }
    F2xExtend(frameView.FrameView, baseView.BaseView);
    frameView.FrameView.prototype.poster = function (value) {
        var s = this;
        if (value && value != "") {
            var img = new Image();
        }
    }
    //注册计时器
    frameView.FrameView.prototype.regTime = function () {
        var s = this;
        s.go();
        s.timeid = setInterval(s.go.bind(this), 1000 / s.speed);
        console.log('regTime');
//      var time = 1000 / s.speed;
//      var d = new Date().getTime();
//      var frameFunc = function(){
//      	var left = new Date().getTime() - d;
//      	if(left >= time){
//      		d = new Date().getTime();
//      		s.go();
//      	}
//      	s.timeid = requestAnimationFrame(frameFunc);
//      }
//      frameFunc();
        
    }
    //移除计时器
    frameView.FrameView.prototype.clearTime = function () {
        var s = this;
        if (s.timeid) {
//      	cancelAnimationFrame(s.timeid);
            clearInterval(s.timeid);
            s.timeid = null;
        }
        console.log('clearTime');
    }
    //跑起来
    frameView.FrameView.prototype.go = function () {
        var s = this;
        if (isNaN(s.index)) {
            s.index = 0;
        }
        var curIndex = s.index;
        var cache = s.cache;
        var loaded = s.loaded;
        var total = s.total;
        var loading = s.loading;
        //这里有个逻辑处理 就是要显示的图片索引大于当前缓存的就停止 等待加载的图片
        if (curIndex >= cache.length && loaded >= total && total != 0) {
            s.isPlay = false;
            s.updateView(s.cache[cache.length - 1].img);
            s._end();
        } else if (curIndex < cache.length && loading == 0) {
			try{
				s.updateView(s.cache[curIndex].img);
			}catch(e){
				
			}
            s.index++;
            if(curIndex < s.cache.length-1)globalDispatcher.dispatchEvent(s.id + "debug", s.loaded + ":" + s.total + ":" + s.index + ":" + s.cache[curIndex].type);
        } else {
            if (loading == 1) {
                var loadto = curIndex + 10;
                if (loadto > total) {
                    loadto = total;
                }
                if (loaded >= loadto) {
            		globalDispatcher.dispatchEvent(s.id + "loading", false);
                    s.loading = 0;
                }
            } else {
            	
            	globalDispatcher.dispatchEvent(s.id + "loading", true);
                s.loading = 1;
            }
        }
        s.options.onFrame(curIndex);
    }
    //转换图片url地址
    frameView.FrameView.prototype.getPath = function (id) {
        var s = this;
        var options = s.options;
        return options.path + id + "." + options.type;
    }
    //加载图片（是加载所有）
    frameView.FrameView.prototype.loadImgs = function () {
        var s = this;
        if (s.isLoad || s.isDestroy) return;
        var max = 25;
        var index = 0;
        if (!s.isLoad) {
            s.isLoad = true;
        }
        s.loaded = 0;
        var ld = function () {
            var len = s.loaded + max;
            var k = s.cache.length;
            if (len > s.total) {
                len = s.total;
                max = len - k;
                console.log('last');
            }
            for (var i = k; i < len; i++) {
                // console.log(s.getPath(i));
                var imgLoader = new ImageLoader(i, s.getPath(i + 1), function (loader) {
                    index++;
                    s.loaded++;
                    s.cache[loader.id] = loader;
                    if (index == max) {
                        index = 0;
                        if (s.loaded < s.total) {
                            // console.log("加载完成一组：" + s.loaded);
                            if (!s.isDestroy) ld();
                        } else {
                        	//加载完成事件
                        	s.options.onLoaded();
                            // console.log('load all：' + s.cache.length);
                        }
                    }
                });
                imgLoader.start();
            }
        }
        ld();
    }
    //内部end事件
    frameView.FrameView.prototype._end = function () {
        var s = this;
        s.clearTime();
        if (s.options.loop) {
            s.index = 0;
            s.isPlay = false;
            s.play();
        } else {
            globalDispatcher.dispatchEvent(s.id + "end");
        }

    }
    //解析一下素材 看看是否有poster图片 resize尺寸
    frameView.FrameView.prototype.parse = function (callback) {
        var s = this;
        var options = s.options;
        //先放一张预览图 默认放第一张 如果有指定图片就放指定图片
        var showUrl = s.getPath(1);
        s.cache = [];
        s.total = options.total;
        s.speed = options.total / options.time;
        if (options.poster && options.poster != "") {
            showUrl = options.poster;
        }
        var imgLoader = new ImageLoader(0, showUrl, function (loader) {
            s.updateView(loader.img);
            s.fW = loader.img.width;
            s.fH = loader.img.height;
            s.resize(loader.img.width, loader.img.height);
            callback();
        });
        imgLoader.start();
    }
    //播放
    frameView.FrameView.prototype.play = function () {
        var s = this;
        if (!s.isPlay) {
            s.isPlay = true;
            s.clearTime();
            s.regTime();
            //开始加载图片
            s.loadImgs();
            globalDispatcher.dispatchEvent(s.id + "play");
        }
    }
    frameView.FrameView.prototype.gotoAndStop = function(value){
        var s = this;
        s.pause();
        s.index = value;
        if(s.index < s.cache.length)s.updateView(s.cache[s.index].img);
    }
    //暂停
    frameView.FrameView.prototype.pause = function () {
        var s = this;
        if (s.isPlay) {
            s.isPlay = false;
            s.clearTime();
            globalDispatcher.dispatchEvent(s.id + "pause");
        }
    }
    //销魂
    frameView.FrameView.prototype.destroy = function () {
        var s = this;
        if (!s.isDestroy) {
            s.isDestroy = true;
            s._end();
            s.cache = [];
        }
    }

    /**
     * 帶声音的序列帧 继承自无声序列类
     */
    var audioFrameView = audioFrameView || {};
    audioFrameView.AudioFrameView = function (options) {
        var s = this;
        frameView.FrameView.call(s, options);
        s.addEventListener(annie.Event.ADD_TO_STAGE, s.addToStage.bind(s));
        
    }
    F2xExtend(audioFrameView.AudioFrameView, frameView.FrameView);
    audioFrameView.AudioFrameView.prototype.addToStage = function () {
        var s = this;
        //当前时间
        s.curTime = 0;
        s.oldIndex = -1;
        s.isPlayAudio = false;
        s.removeEventListener(annie.Event.ADD_TO_STAGE, s.addToStage);
        s.initAudio();
    }
    //初始化音频
    audioFrameView.AudioFrameView.prototype.initAudio = function () {
        var s = this;
        s.vAudio = null;
        s.audio = null;
        s.audioLoading = 0;
        s.vAudio = $('<audio controls="controls"></audio>').css({
            position: "absolute",
            width: "90%",
            left: "50%",
            bottom: "5%",
            x: "-50%"

        }).appendTo($("#" + s.id)).hide();
        s.vAudio.attr('src', s.options.audio);
        s.audio = s.vAudio[0];
//      s.audio.addEventListener("timeupdate", s.audioTimeUpdate.bind(s));
        s.audio.addEventListener('play', s.audioPlay.bind(s));
        // audio.addEventListener('pause', audioPause);
        s.audio.addEventListener('ended', s.audioEnd.bind(s));
    }
	audioFrameView.AudioFrameView.prototype.checkPlay = function(){
		var s = this;
		//检测声音的索引
        var fuc = function(){
        	var audio = s.audio;
        	var currentTime = parseInt(audio.currentTime * 100);
        	var duration = parseInt(audio.duration * 100);
            s.index = Math.floor(s.options.total * currentTime / duration);
//      	console.log(s.index);
            if(s.index > (s.options.total - 1)){
                s.index = s.options.total - 1
            }
            if(s.cache.length > 0 && s.index < (s.cache.length-1) && s.index > 0){
                globalDispatcher.dispatchEvent(s.id + "debug", s.loaded + ":" + s.total + ":" + (s.index+1) + ":" + s.cache[s.index-1].type + ":" + audio.currentTime +":"+ audio.duration);
            }
        }
        fuc();
        s.checkId = setInterval(function(){
			fuc();        	
        },10);
	}
    //音频播放事件
    audioFrameView.AudioFrameView.prototype.audioPlay = function(){
        var s = this;
//      s.clearTime();
//      trace('audioPlay');
//      s.regTime();
    }
    //音频结束事件
    audioFrameView.AudioFrameView.prototype.audioEnd = function(){
        var s = this;
        globalDispatcher.dispatchEvent(s.id + "debug", s.loaded + ":" + s.total + ":" + (s.index+1) + ":" + s.cache[s.index].type + ":" + s.audio.currentTime +":"+ s.audio.duration);
        s._end();
        s.index = 0;
        s.audio.currentTime = 0;
        s.isPlay = false;
        if(s.checkId){
        	clearInterval(s.checkId);
        	s.checkId = null;
        }
    }
    //音频真的播放（内部方法）
    audioFrameView.AudioFrameView.prototype._realPlay = function(){
        var s = this;
        s.audio.play();
        var durFunc = function(){
            if (isNaN(s.audio.duration)) {
                setTimeout(durFunc,10);
                console.log('isNaN');
            }else{
                s.isPlayAudio = true;
                var duration = parseInt(s.audio.duration * 100);
                var time = (s.index+1) * duration / s.options.total / 100;
                console.log(time);
                console.log(s.audio.currentTime);
                s.audio.currentTime = time;
                s.checkPlay();
            }
        }
        setTimeout(durFunc,300);
        globalDispatcher.dispatchEvent(s.id + "play");
    }
    audioFrameView.AudioFrameView.prototype._mathPlay = function(value){
    	var s = this;	
    	var duration = parseInt(s.audio.duration * 100);
        var time = value * duration / s.options.total / 100;
        console.log(time);
        if(time >= 0){
        	s.audio.currentTime = time;
       		s.oldIndex = -1;
        	s.index = value;
        }
    }
    audioFrameView.AudioFrameView.prototype._parseNoAudio = function(){
    	var s = this;
        var audio = s.audio;
        s.index++;
        console.log("_parseNoAudio:" + s.index);
        if(s.index < s.cache.length)s.updateView(s.cache[s.index].img);
    }
    audioFrameView.AudioFrameView.prototype._parseHasAudio = function(){
    	var s = this;
        var audio = s.audio;
    	//这里有个逻辑处理一下
        //因为要保证音频同步 因此图片的播放是根据声音的时间来处理的
        //如果声音播放到某一刻 但是图片木有加载到就需要暂停等待
        //目前的策略是等待音频的5秒时间
//      console.log(s.index);
        if (audio.paused || audio.seeking) {
            globalDispatcher.dispatchEvent(s.id + "loading", true);
            if (s.index == 0) {
                if (s.loaded > 15) {
                    s.updateView(s.cache[0].img); //因为第一帧是黑屏，所以视频加载中的时候显示第1帧画面。
                    audio.play();
                }
            } else {
                if (s.index >= s.cache.length) {
                    s.index = s.cache.length - 1;
                }
                s.updateView(s.cache[s.index].img);
                if (s.audioLoading == 1) {
                    var loadto = s.index + s.speed * 2;
                    if (loadto > s.options.total) {
                        loadto = s.options.total;
                    }
                    if (s.loaded >= loadto) {
                        s.audioLoading = 0;
                        //当加载图片数超过mp3播放帧数，并预加载完之后的5秒，继续播放
                		globalDispatcher.dispatchEvent(s.id + "loading", false);
                        audio.play();
                    }
                }else{
                	audio.play();
                }
            }
        } else {
            if (s.index >= 0) {
                globalDispatcher.dispatchEvent(s.id + "loading", false);
                if (s.index > s.loaded) {
                    //当mp3播放帧数超过图片加载的数量后
                    audio.pause();
                	globalDispatcher.dispatchEvent(s.id + "loading", true);
                    s.audioLoading = 1;
                }
//              s.curTime = 0;
                var m = parseInt(s.index + s.curTime);
//              console.log(s.curTime);
//              if(m > s.oldIndex){
                	s.oldIndex = m;
                	if(s.cache[m]){
	                	s.updateView(s.cache[m].img);
	                }
//              }
                
//              s.curTime += 1.2;
            } else {
                s.updateView(s.cache[0].img)
            }
        }
    }
    //重写跑起来 因为多了一个音频要同步
    audioFrameView.AudioFrameView.prototype.go = function () {
        var s = this;
        if (isNaN(s.index)) {
            s.index = 0;
        }
        if(s.cache.length == 0){
            return;
        }
        //在还没有播放音频的时候
        //这里有个小问题 就是当声音还没有开始播放的时候图片先走起来 等声音真来了 就用声音的方式播放
        if(!s.isPlayAudio){
        	s._parseNoAudio();
        }else{
        	s._parseHasAudio();
        }
        
        s.options.onFrame(s.index);
    }
    //重写播放
    audioFrameView.AudioFrameView.prototype.play = function(value){
        var s = this;
        if(value > 0){
//      	s._mathPlay(value);
        }
        if (!s.isPlay && s.audio) {
            s.isPlay = true;
            var wsb = window;
            if (wsb.WeixinJSBridge) {
                try {
                    wsb.WeixinJSBridge.invoke("getNetworkType", {}, function () {
                        s._realPlay();
                    });
                } catch (e) {
                    s._realPlay();
                }
            } else {
                s._realPlay();
            }
            s.regTime();
            //开始加载图片
            s.loadImgs();
        }
    }
    audioFrameView.AudioFrameView.prototype.gotoAndStop = function(value){
    	var s = this;	
    	s.isPlay = false;
        s.clearTime();
        s.audio.pause();
    	var duration = parseInt(s.audio.duration * 100);
        var time = value * duration / s.options.total / 100;
        if(time >= 0){
        	s.audio.currentTime = time;
       		s.oldIndex = -1;
        	s.index = value;
        	s.updateView(s.cache[value].img);
        }
        globalDispatcher.dispatchEvent(s.id + "pause");
    }
    //暂停
    audioFrameView.AudioFrameView.prototype.pause = function () {
        var s = this;
        if (s.isPlay && s.audio) {
            s.isPlay = false;
            s.clearTime();
            s.audio.pause();
            globalDispatcher.dispatchEvent(s.id + "pause");
        }
    }
    //音量
    audioFrameView.AudioFrameView.prototype.volume = function (value) {
        var s = this;
        if (s.audio) {
            s.audio.volume = value;
        }
    }
    //静音
    audioFrameView.AudioFrameView.prototype.muted = function (muted) {
        var s = this;
        if (s.audio) {
            s.audio.muted = muted;
        }
    }
    //重写销毁
    audioFrameView.AudioFrameView.prototype.destroy = function () {
        var s = this;
        if (!s.isDestroy) {
            s.isDestroy = true;
            s._end();
            s.cache = [];
            if(s.checkId){
            	clearInterval(s.checkId);
            	s.checkId = null;
            }
//          s.audio.removeEventListener("timeupdate", s.audioTimeUpdate);
            s.audio.removeEventListener('play', s.audioPlay);
            // audio.addEventListener('pause', audioPause);
            s.audio.removeEventListener('ended', s.audioEnd);
            s.audio.pause();
            s.audio = null;
        }
    }

})(jQuery);