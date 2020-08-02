#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1024;
var mousex=0.0, mousey=0.0;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
var t = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	gs.color({rgb: [170, 0, 255]});
	var d = Math.sqrt(mousex*mousex + mousey*mousey)/100;
	for(var j=0;j<8;++j) {
		for(var i=0;i<8;++i) {
			var r = 8.0;
			var func = (i+j)&1 ? gs.poly : gs.opoly;
			func({x:25*(i-3.5), y:25*(j-3.5), s:8, r:r, a:t, r2:d});
		}
	}
	var a = 6.28*t*.001;
	var r = 60;
	gs.color({rgb: [255, 255, 0]});
	var x = r*Math.cos(a);
	var y = r*Math.sin(a);
	gs.disc({x:x, y:y, r:10});
	gs.disc({x:90, y:y, r:10});
	gs.disc({x:x, y:-90, r:10});
	gs.update();
	++t;
}
setInterval(pulse, 20);
