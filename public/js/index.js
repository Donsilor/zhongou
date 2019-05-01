$(document).ready(function(){
	
	//-----------------------------------------定义和初始化变量----------------------------------------
	var loadBox=$('aside.loadBox');
	var articleBox=$('article');
	var windowScale=window.innerWidth/750;
	
	//----------------------------------------页面初始化----------------------------------------
	icom.init(init);//初始化
	icom.screenScrollUnable();//如果是一屏高度项目且在ios下，阻止屏幕默认滑动行为
	
	function init(){
		requestAnimationFrame(function(){
			sound_handler();
			loadBox.show();
			load_handler();
		});
	}//edn func

	function sound_handler(){
		if(os.weixin) {
			try {
				WeixinJSBridge.invoke("getNetworkType", {}, sound_creat);
			}//end try
			catch(e) {
				wx.ready(sound_creat);
			}//edn catch
		}//edn if
		else sound_creat();
	}//edn func

	function sound_creat(){
		//bgm
		//webaudio在ios下自动播放目前不行
		//ibgm.init({src:'sound/bgm.mp3',autoplay:true});
	}//end func
	
	
	//----------------------------------------加载页面图片----------------------------------------
	function load_handler(){
		var loader = new PxLoader();
		loader.addImage('images/common/turn_phone.png');
		for(var i = 1;i<10;i++){
			loader.addImage('images/video/'+i+'.png');

		}
		
		//实际加载进度
//		loader.addProgressListener(function(e) {
//			var per=Math.round(e.completedCount/e.totalCount*50);
//			loadPer.html(per+'%');
//		});
		
		loader.addCompletionListener(function() {
			init_handler();
//			load_timer(50);//模拟加载进度
			loader=null;
		});
		loader.start();	
	}//end func
	
	//模拟加载进度
	function load_timer(per){
		per=per||0;
		per+=imath.randomRange(1,3);
		per=per>100?100:per;
		loadPer.html(per+'%');
		if(per===100) setTimeout(init_handler,200);
		else setTimeout(load_timer,33,per);
	}//edn func
	
	//----------------------------------------页面逻辑代码----------------------------------------
	function init_handler(){
		console.log('init handler');
		icom.fadeOut(loadBox,500);
		icom.fpsShow();

		init_gif();



	}//end func

	function init_gif () {
		var gif = $(".gifbox");
		gif.VP({
			debug: false,
			autoPlay: true,
			type:"png",
			total: 103,
			time: 32,
			// path: "http://cdn.12345html5.com/cdn/ceibs/",
			path: "images/video/",
			mode: 1,
			// loading:loadBox,
			loop: false,
			scaleMode: "fixedWidth",
			onEnd: function () {
				// icom.alert("播放结束跳转页面");
				window.location.href="form/canyu.html";
				gif.gotoAndStop(1);
				icom.fadeIn($(".p1"),500,function function_name () {
					$(".p1 .pic2").css({scale:1}).transition({scale:1.8},1000);
					$(".p1 .pic3").css({opacity:0,y:20,display:"block"}).transition({opacity:1,y:0,delay:500},1000);
				});
			}
			
		});
	}
	

});//end ready
