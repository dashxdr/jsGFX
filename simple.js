#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
var mouse = {x:0,y:0};
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
});
gfx.on('motion', function(x, y) {mouse.x = x;mouse.y=y;});
var t = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	gs.color({rgb: [255, 255, 255]});
	var size=4;
	var p=t;
	gs.poly({x:0, y:0, r:size, a:p});

	gs.update();
	++t;
}
setInterval(pulse, 20);
