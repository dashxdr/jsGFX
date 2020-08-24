"use strict";

var mylog = console.log;
const EventEmitter = require('events');
class My_Emitter extends EventEmitter {}
const emitter = new My_Emitter();

var mod = require('./mod');
exports.matrix = require('./matrix.js');
exports.s = mod.s;

function newBuffer(len) {
	return Buffer.alloc(len);
}

var eventHandlers = {
	motion: function(msg) {emitter.emit('motion', msg.x, msg.y);},
	button: function(msg) {emitter.emit('button', msg.button, msg.pressed, msg.x, msg.y);},
	key: function(msg) {emitter.emit('key', msg.code, msg.mod, msg.pressed);},
	wheel: function(msg) {emitter.emit('wheel', msg.v);},
	resize: function(msg) {emitter.emit('resize', msg.vw, msg.vh, msg.w, msg.h);},
	log: function(msg) {mylog('log:', msg.msg);},
	test: function(msg) { mylog('test received');},
};
function processEvents(events) {
	events.forEach(function(e) {
		emitter.emit('event', e);
		var func = eventHandlers[e.type];
		if(func) func(e);
	});
}

exports.send = function(data) {
	var func = exports.s[data.cmd];
	if(func) {
		func(data);
	} else mylog('fail!', data.cmd);
}

exports.on = function(ev, func) {emitter.on(ev, func);}
exports.once = function(ev, func) {emitter.once(ev, func);}
exports.emit = function() {emitter.emit.apply(emitter, arguments);}
exports.quit = function() {mod.quit();process.kill(process.pid, 'SIGINT');}
exports.asc = function(c) {return c.charCodeAt(0);}
exports.k = mod.k; // keycodes
exports.c = {
	grey200:[200,200,200],
	grey180:[180,180,180],
	white: [255,255,255],
	black: [0,0,0],
	red: [255,0,0],
	yellow: [255,255,0],
	salmon: [250,128,114],
	pink: [255,192,203],
	orange: [255,165,0],
	violet: [238,130,238],
	green: [0,128,0],
	darkgreen: [0,100,0],
	lime: [0,255,0],
	aqua: [0,255,255],
	cyan: [0,255,255],
	blue: [0,0,255],
	darkblue: [0,0,139],
	navy: [0,0,128],
	gray: [128,128,128],
	silver: [192,192,192],
	gold: [212,175,55],
	aliceblue: [240,248,255],
	antiquewhite: [250,235,215],
	aquamarine: [127,255,212],
	azure: [240,255,255],
	beige: [245,245,220],
	bisque: [255,228,196],
	blanchedalmond: [255,235,205],
	blueviolet: [138,43,226],
	brown: [165,42,42],
	burlywood: [222,184,135],
	cadetblue: [95,158,160],
	chartreuse: [127,255,0],
	chocolate: [210,105,30],
	coral: [255,127,80],
	cornflowerblue: [100,149,237],
	cornsilk: [255,248,220],
	crimson: [220,20,60],
	darkcyan: [0,139,139],
	darkgoldenrod: [184,134,11],
	darkgray: [169,169,169],
	darkkhaki: [189,183,107],
	darkmagenta: [139,0,139],
	darkolivegreen: [85,107,47],
	darkorange: [255,140,0],
	darkorchid: [153,50,204],
	darkred: [139,0,0],
	darksalmon: [233,150,122],
	darkseagreen: [143,188,143],
	darkslateblue: [72,61,139],
	darkslategray: [47,79,79],
	darkturquoise: [0,206,209],
	darkviolet: [148,0,211],
	deeppink: [255,20,147],
	deepskyblue: [0,191,255],
	dimgray: [105,105,105],
	dodgerblue: [30,144,255],
	firebrick: [178,34,34],
	floralwhite: [255,250,240],
	forestgreen: [34,139,34],
	fuchsia: [255,0,255],
	gainsboro: [220,220,220],
	ghostwhite: [248,248,255],
	goldenrod: [218,165,32],
	greenyellow: [173,255,47],
	honeydew: [240,255,240],
	hotpink: [255,105,180],
	indianred: [205,92,92],
	indigo: [75,0,130],
	ivory: [255,255,240],
	khaki: [240,230,140],
	lavender: [230,230,250],
	lavenderblush: [255,240,245],
	lawngreen: [124,252,0],
	lemonchiffon: [255,250,205],
	lightblue: [173,216,230],
	lightcoral: [240,128,128],
	lightcyan: [224,255,255],
	lightgoldenrodyellow: [250,250,210],
	lightgray: [211,211,211],
	lightgrey: [211,211,211],
	lightgreen: [144,238,144],
	lightpink: [255,182,193],
	lightsalmon: [255,160,122],
	lightseagreen: [32,178,170],
	lightskyblue: [135,206,250],
	lightslategray: [119,136,153],
	lightsteelblue: [176,196,222],
	lightyellow: [255,255,224],
	limegreen: [50,205,50],
	linen: [250,240,230],
	magenta: [255,0,255],
	maroon: [128,0,0],
	mediumaquamarine: [102,205,170],
	mediumblue: [0,0,205],
	mediumorchid: [186,85,211],
	mediumpurple: [147,112,216],
	mediumseagreen: [60,179,113],
	mediumslateblue: [123,104,238],
	mediumspringgreen: [0,250,154],
	mediumturquoise: [72,209,204],
	mediumvioletred: [199,21,133],
	midnightblue: [25,25,112],
	mintcream: [245,255,250],
	mistyrose: [255,228,225],
	moccasin: [255,228,181],
	navajowhite: [255,222,173],
	oldlace: [253,245,230],
	olive: [128,128,0],
	olivedrab: [107,142,35],
	orangered: [255,69,0],
	orchid: [218,112,214],
	palegoldenrod: [238,232,170],
	palegreen: [152,251,152],
	paleturquoise: [175,238,238],
	palevioletred: [216,112,147],
	papayawhip: [255,239,213],
	peachpuff: [255,218,185],
	peru: [205,133,63],
	plum: [221,160,221],
	powderblue: [176,224,230],
	purple: [128,0,128],
	rosybrown: [188,143,143],
	royalblue: [65,105,225],
	saddlebrown: [139,69,19],
	sandybrown: [244,164,96],
	seagreen: [46,139,87],
	seashell: [255,245,238],
	sienna: [160,82,45],
	skyblue: [135,206,235],
	slateblue: [106,90,205],
	slategray: [112,128,144],
	snow: [255,250,250],
	springgreen: [0,255,127],
	steelblue: [70,130,180],
	tan: [210,180,140],
	teal: [0,128,128],
	thistle: [216,191,216],
	tomato: [255,99,71],
	turquoise: [64,224,208],
	wheat: [245,222,179],
	whitesmoke: [245,245,245],
	yellowgreen: [154,205,50],
};
exports.audio = function(f) {mod.audio = f;}
exports.loadmp3 = function(name) {
	var o = mod.loadmp3(name);
	if(o) {
		o.on = function(event, func, a,b,c,d,e) {
			if(event=='ready') // just call it, we begin life "ready"
				func(a,b,c,d,e);
		}
	}
	return o;
}
exports.loadpng = function(name) {return mod.loadpng(name);}
exports.g = mod.g;
exports.g.POINTS = 0;
exports.g.LINES = 1;
exports.g.LINE_STRIP = 3;
exports.g.LINE_LOOP = 2;
exports.g.TRIANGLES = 4;
exports.g.TRIANGLE_STRIP = 5;
exports.g.TRIANGLE_FAN = 6;

exports.setup = function(o) {
	var side = 1024;
	var pos = 100;
	if(o===undefined) o={};
	else if(typeof o == 'number') o={w:o, h:o}
	if(!o.w) o.w=side;
	if(!o.h) o.h=side;
	if(!o.x) o.x=pos;
	if(!o.y) o.y=pos;
	if(!mod.setup(o.x,o.y,o.w,o.h)) {
		emitter.emit('connect');
		setInterval(function() {
			var events = mod.pollInput();
			if(events) processEvents(events);
			var n = mod.pollAudio();
			if(n>0) {
				if(mod.audio)
					mod.feedAudio(mod.audio(n));
			}
		}, 10);
	}

	function mycc() {
		mylog('Exit...');
		process.removeListener('SIGINT', mycc);
		process.kill(process.pid, 'SIGINT');
		engine.kill('SIGINT');
	}
	process.on('SIGINT', mycc);
	process.on('SIGTERM', mycc);
}
