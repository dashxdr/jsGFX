#!/usr/bin/env node
"use strict";

var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;

gfx.on('key', function(code, mod, pressed) {
//	mylog('code=' + code, 'mod=' + mod, 'pressed=' + pressed);
	if(code==27 && pressed) gfx.quit();
});
gfx.setup({w:512, h:512});

var c = 0;
function pulse() {
	++c;
	gs.color({rgb: [0, 128, 255]});
	gs.clear();
	for(var i=0;i<2;++i) {
		var x = (i==0) ? -50 : 50;
		var y = 50;
		var a = c*.2;
//		if(i==0) a=3.14159-a;
		var r = 18;
		var dx = r*Math.cos(a);
		var dy = r*Math.sin(a);
		if(1) {
			gs.pen({r:1});
			gs.color({rgb: [0, 0, 0]});
			gs.circle({x:x, y:50, r:40});
		}
		if(1) {
			gs.color({rgb: [255, 255, 255]});
			gs.disc({x:x, y:50, r:39.5});
		}
		gs.color({rgb: [0, 0, 0]});
		gs.disc({x:x+dx, y:y+dy, r:20});
	}
	if(1) {
		var dx=80, dy=20;
		gs.color({rgb: [0, 0, 0]});
		gs.disc({x:0, y:-50, dx:dx, dy:dy, r:20, a:0});
		gs.pen({r:3});
		gs.color({rgb: [255, 255, 255]});
		gs.circle({x:0, y:-50, dx:dx, dy:dy, r:20, a:0});
	}
	gs.update();
}
setInterval(pulse, 20);
