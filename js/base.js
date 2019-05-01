//2018.1.3
//-----------------------------------os
var os = importOS();

function importOS() {
	var userAgent = navigator.userAgent;
	var os = {};
	os.userAgent = userAgent;
	os.android = userAgent.match(/(Android)\s+([\d.]+)/) || userAgent.match(/Silk-Accelerated/) ? true : false;
	os.ipad = userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false;
	os.iphone = !os.ipad && userAgent.match(/(iPhone\sOS)\s([\d_]+)/) ? true : false;
	os.ios = os.ipad || os.iphone;
	os.wp = userAgent.match(/Windows Phone/) || userAgent.match(/IEMobile/) ? true : false;
	os.supportsTouch = ((window.DocumentTouch && document instanceof window.DocumentTouch) || 'ontouchstart' in window);
	if(os.ios) os.iosVer = parseInt(userAgent.match(/OS \d+_/)[0].match(/\d+/)[0]);
	os.weixin = userAgent.match(/MicroMessenger/) ? true : false;
	if(os.weixin) {
		var ver = userAgent.match(/MicroMessenger\/\d+.\d+.\d+/)[0].match(/\d+.\d+.\d+/)[0].split('.');
		os.weixinVer = 0;
		for(var i = 0; i < ver.length; i++) os.weixinVer += parseInt(ver[i]) * Math.pow(10, ver.length - i - 1);
	} //edn if
	os.weibo = userAgent.match(/Weibo/) || userAgent.match(/weibo/) ? true : false;
	os.ali = userAgent.match(/AliApp/) ? true : false;
	if(os.ali) {
		os.alipay = userAgent.match(/Alipay/) ? true : false;
		os.taobao = userAgent.match(/WindVane/) ? true : false;
	} //edn if
	os.netease = userAgent.match(/NewsApp/) ? true : false;
	os.safari = os.ios && userAgent.match(/Safari/) ? true : false;
	os.chrome = userAgent.match(/Chrome/) ? true : false;
	os.firefox = userAgent.match(/Firefox/) ? true : false;
	os.ie = document.documentMode;
	os.edge = userAgent.match(/Edge/) ? true : false;
	os.pc = !(os.android || os.ios || os.wp);
	if(os.ios) {
		os.iphoneX = (screen.width == 375 && screen.height == 812) || (screen.width == 375 && window.innerHeight >= 635) || (window.innerWidth == 724 && window.innerHeight == 375) || (window.innerWidth == 375 && window.innerHeight == 724) || (window.innerWidth == 812 && window.innerHeight == 343) || (window.innerWidth == 343 && window.innerHeight == 812);
		os.iphoneXWeixin = os.iphoneX && os.weixin;
		os.iphoneXWeibo = os.iphoneX && os.weibo;
		os.iphone6Plus = (screen.width == 414 && screen.height == 736) || (screen.width == 414 && window.innerHeight >= 622);
		os.iphone6 = (screen.width == 375 && screen.height == 667) || (screen.width == 375 && window.innerHeight <= 603);
		os.iphone5 = (screen.width == 320 && screen.height == 568) || (screen.width == 320 && window.innerHeight >= 460);
		os.iphone4 = (screen.width == 320 && screen.height == 480) || (screen.width == 320 && window.innerHeight <= 450);
	} //edn if
	else if(os.android) {
		requestAnimationFrame(function() {
			os.screen159 = (screen.width == 360 && window.innerHeight < 540) || (screen.width == 412 && window.innerHeight < 640);
			os.screen189 = (screen.width == 360 && window.innerHeight > 590) || (screen.width == 412 && window.innerHeight > 680) || (screen.width == 393 && window.innerHeight > 660);
		});
		os.miui = userAgent.match(/MI/) || userAgent.match(/Redmi/) ? true : false;
		os.huawei = userAgent.match(/HUAWEI/) ? true : false;
		os.oppo = userAgent.match(/OPPO/) ? true : false;
		os.vivo = userAgent.match(/vivo/) ? true : false;
	} //edn if
	os.facebook = userAgent.match(/(FB)/) ? true : false;

	return os;
} //end func

//-----------------------------------base
var ibase = importBase();

function importBase() {
	var base = {}
	base.dir = 'portrait';
	base.lock = false;
	base.cssMedia = 750;
	base.scrollTop = -1;
	base.iphoneXOffsetLandscape=44;
	base.iphoneXOffsetPortrait=35;

	base.init = function(dir, unit, wd, ht, scale, lock, follow) {
		this.dir = dir || 'portrait';
		this.simulation = window.orientation === undefined;
		this.landscapeWidth = wd || 1206;
		this.landscapeHeight = ht || 750;
		this.landscapeScaleMode = scale || 'cover';
		this.landscapeLock = lock || 0;
		this.landscapeLock = this.simulation ? false : this.landscapeLock;
		this.landscapeFollow = follow || 0;
		this.landscapeFollow = !this.landscapeLock ? true : this.landscapeFollow;
		this.landscapeFirstDir = base.getOrient(true);
		this.unit = this.dir == 'landscape' ? 'px' : (unit || 'rem');
		console.log('simulation:' + this.simulation);
		console.log('landscapeLock:' + this.landscapeLock);
		console.log('css unit:' + unit);
		this.debug = parseInt(this.getQueryString('debug')) || 0;
		console.log('ibase debug:' + base.debug);
		if(this.dir == 'portrait') {
			if(this.unit == 'rem' || this.unit == 'em') {
				document.write('<meta name="viewport" content="width=device-width,target-densitydpi=device-dpi,initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no">');
				document.write('<link rel="stylesheet" type="text/css" href="css/common.css" />');
			} //end if
			else {
				document.write('<meta name="viewport" content="width=' + base.cssMedia + ', minimum-scale = ' + window.screen.width / base.cssMedia + ', maximum-scale = ' + window.screen.width / base.cssMedia + ', target-densitydpi=device-dpi">');
				document.write('<link rel="stylesheet" type="text/css" href="css/common.px.css" />');
			} //edn else
			document.write('<aside class="turnBoxPortrait" id="turnBox"><div class="phone"><img src="images/common/turn_phone.png"><i class="yes"></i><i class="no"></i></div><p>竖屏体验更佳</p></aside>');
			this.turnBox = document.getElementById("turnBox");
			if(this.dir != base.getOrient(true)) {
				this.turnBox.style.display = "block";
				this.lock = true;
			} //edn if
			window.addEventListener("orientationchange", window_orientation, false);
		} //edn if
		else {
			document.write('<link rel="stylesheet" type="text/css" href="css/common.landscape.css" />');
			if(this.landscapeLock) {
				document.write('<aside class="turnBoxLandscape" id="turnBox"><div class="lock"><span></span><span></span></div><div class="sign"><span>竖排方向锁定：关闭</span><span>竖排方向锁定：打开</span></div><div class="phone"><img src="images/common/turn_phone.png"><i class="yes"></i><i class="no"></i></div><p>锁定竖屏体验更佳</p></aside>');
				this.turnBox = document.getElementById("turnBox");
				if(this.landscapeFirstDir == 'landscape') {
					this.turnBox.style.display = "block";
					this.lock = true;
				} //edn if
				window.addEventListener("orientationchange", landscape_lock, false);
			} //edn if
		} //end else
	} //end func

	base.unlockOrient = function() {
		window.removeEventListener("orientationchange", window_orientation, false);
		base.turnBox.style.display = 'none';
		document.body.scrollTop = 0;
	}; //end func

	base.getOrient = function(resize) {
		resize = resize || 0;
		if(resize) var dir = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
		else var dir = window.orientation == 90 || window.orientation == -90 ? 'landscape' : 'portrait';
		console.log('window orientation:' + dir);
		return dir;
	}; //end func

	function landscape_lock(e) {
		if(base.getOrient() == 'landscape') {
			base.turnBox.style.display = "block";
			base.lock = true;
		} //edn if
		else {
			base.turnBox.style.display = 'none';
			base.lock = false;
		} //end else
	} //end func

	function window_orientation(e) {
		if(base.dir != base.getOrient()) {
			base.turnBox.style.display = 'block';
			base.lock = true;
			if(os.ios) {
				if(base.scrollTop == -1 && document.body.scrollTop > 0) {
					base.scrollTop = document.body.scrollTop;
					document.body.scrollTop = 0;
				} //edn if
			} //end if
		} //edn if
		else {
			base.turnBox.style.display = 'none';
			base.lock = false;
			if(os.ios) {
				if(base.scrollTop != -1) {
					document.body.scrollTop = base.scrollTop;
					base.scrollTop = -1;
				} //edn if
			} //edn if
		} //end else
	} //end func

	base.load = function(f, shell, nocache) {
		nocache = nocache != null ? nocache : true;
		var file = get_filetype(f, nocache);
		if(file.type == "css") {
			shell = shell || 'head';
			var fileref = document.createElement('link');
			fileref.setAttribute("rel", "stylesheet");
			fileref.setAttribute("type", "text/css");
			fileref.setAttribute("href", file.src);
			document.getElementsByTagName(shell)[0].appendChild(fileref);
		} //end if
		else if(file.type == "js") {
			shell = shell || 'body';
			var fileref = document.createElement('script');
			fileref.setAttribute("type", "text/javascript");
			fileref.setAttribute("src", file.src);
			document.querySelector('body').appendChild(fileref);
		} //end else
	} //end func

	base.creatNode = function(nodeName, idName, className, innerHTML, wrapNode) {
		nodeName = nodeName || 'div';
		className = className || '';
		idName = idName || '';
		innerHTML = innerHTML || '';
		wrapNode = wrapNode || document.querySelector('body');
		var newNode = document.createElement(nodeName);
		if(className != '') newNode.className = className;
		if(idName != '') newNode.id = idName;
		if(innerHTML != '') newNode.innerHTML = innerHTML;
		wrapNode.appendChild(newNode);
	} //end func

	base.getUrl = function(url) {
		var hmsr = icom.getQueryString('hmsr');
		hmsr = hmsr || '';
		var utm_source = icom.getQueryString('utm_source');
		utm_source = utm_source || '';
		if(url && url != '') {
			url += (hmsr != '' ? (url.indexOf('?') == -1 ? '?' : '&') + 'hmsr=' + hmsr : '') + (utm_source != '' ? '&utm_source=' + utm_source : '');
			location.href = url;
		} //end if
	} //edn func

	//获得http url参数
	base.getQueryString = function(name) {
		if(name && name != '') {
			var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
			var r = window.location.search.substr(1).match(reg);
			if(r != null) return decodeURIComponent(r[2]);
			return null;
		} //end if
		else return null;
	} //end func

	function get_filetype(f, nocache) {
		nocache = nocache != null ? nocache : true;
		var tmp = f.split('.');
		var type = tmp[tmp.length - 1];
		var src = f + (nocache ? '?v=' + Math.random() : '');
		return {
			type: type,
			src: src
		};
	} //end func

	//各种手机的屏幕参数
	base.screenList = {
		'iphone5': {
			screen: '320x568',
			weixin: '320x504',
			browser: '320x460'
		},
		'iphone6/7/8': {
			screen: '375x667',
			weixin: '375x603',
			browser: '375x553'
		},
		'iphone6/7/8 plus': {
			screen: '414x736',
			weixin: '414x672',
			browser: '414x622'
		},
		'iphoneX': {
			screen: '375×812',
			weixin: '375x724',
			browser: '375x635'
		},
		'android 15:9 720p/1080p': {
			screen: '360x640',
			weixin: '360x526',
			browser: '360x468'
		},
		'android 15:9 1440p': {
			screen: '412x732',
			weixin: '412x612',
			browser: '412x554'
		},
		'android 16:9 720p/1080p': {
			screen: '360x640',
			weixin: '360x572',
			browser: '360x514'
		},
		'android 16:9 1440p': {
			screen: '412x732',
			weixin: '412x660',
			browser: '412x612'
		},
		'android 18:9 720p/1080p': {
			screen: '360x720',
			weixin: '360x606',
			browser: '360x550'
		},
		'android 18:9 1440p': {
			screen: '412x823',
			weixin: '412x703',
			browser: '412x645'
		},
		'android 18:9 mix2': {
			screen: '393x786',
			weixin: '393x667',
			browser: '393x609'
		}
	};

	return base;
} //end func