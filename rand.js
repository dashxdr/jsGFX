#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1024;
var drawOutline = 1;
var size = 8;
var sizeMin = 5;
var sizeMax = 30;
var transparent = 0;
var boxes = 1;
var colored = 1;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==27 && pressed) gfx.quit();
	if(code==111) drawOutline^=1;
	if(code==116) transparent^=1;
	if(code==98) boxes^=1;
	if(code==99) colored^=1;
	mylog(code);
});
gfx.on('wheel', function(v) {
	size += v;
	size = Math.min(size, sizeMax);
	size = Math.max(size, sizeMin);
});
function rand(x) {
	return Math.floor(Math.random()*x);
}
var t = 0.0;
function pulse() {
//	gs.color({rgb: [0, 0, 0]});
//	gs.clear();

	var alpha = transparent ? 128 : 255;
	for(var i=0;i<20;++i) {
		var color;
		if(colored)
			gs.color({rgb: [rand(256), rand(256), rand(256),alpha]});
		else {
			var t = rand(256);
			gs.color({rgb: [t, t, t,alpha]});
		}
		function rd() {return rand(200)-100.0};
		var x = rd();
		var y = rd();
		if(boxes) {
			gs.box({x:x, y:y, dx:size, dy:size});
			if(drawOutline) {
				gs.color({rgb: [0,0,0]});
				gs.rect({x:x, y:y, dx:size, dy:size});
			}
		} else {
			gs.disc({x:x, y:y, r:size});
			if(drawOutline) {
				gs.color({rgb: [0,0,0]});
				gs.circle({x:x, y:y, r:size});
			}
		}
	}

	gs.update();
	++t;
}
setInterval(pulse, 50);
