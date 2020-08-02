#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1024;
var mousex=0.0, mousey=0.0;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
var t = 0.0;
var green = [0, 255, 0];
var blue = [0, 0, 255];
function pulse() {
	gs.color({rgb: green});
	gs.clear();

	gs.color({rgb: blue});
	var d = Math.sqrt(mousex*mousex + mousey*mousey)/100;
	for(var j=0;j<8;++j) {
		for(var i=0;i<8;++i) {
			var r = 8.0;
			var func = (i+j)&1 ? gs.poly : gs.opoly;
			func({x:25*(i-3.5), y:25*(j-3.5), s:6, r:r, a:t, r2:d});
		}
	}
	gs.update();
	++t;
}
setInterval(pulse, 50);
