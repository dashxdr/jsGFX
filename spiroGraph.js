#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
gfx.setup({w:edge, h:edge});
var mouse = {x:0, y:0};
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
});
gfx.on('motion', function(x, y) {mouse.x=x;mouse.y=y;});
var t = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();
	gs.color({rgb: [255, 255, 255]});
	function add(r, f) {
		var a = f*t*.01;
		x += r*Math.cos(a);
		y += r*Math.sin(a);
	}
	for(var i=0;i<500;++i) {
		var x = 0, y = 0;
		var s = .1;
		add(60, mouse.x*s);
		add(60, mouse.y*s);
		gs.disc({x:x, y:y, r:.4});
		++t;
	}
	gs.update();
}
setInterval(pulse, 10);
