#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1200;
var mousex=0.0, mousey=0.0;
var cubic = false;
gfx.setup({w:edge, h:edge});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code==32) cubic=!cubic;
});
var time = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	gs.color({rgb: [255, 255, 255]});
	gs.box({x:0, y:20, dx:10, dy:25});
	if(true) {
		gs.color({rgb: [0, 0, 255]});
		var x, y;
		for(var j=0;j<2;++j) {
			var points = [];
			x = y = 25;
			var o = Math.max(x, x+mousex*.25);
			if(j) o=-o;
			for(var i=0;i<4;++i) {
				var p = [];
				p.push(x+o+.4, y-15);
				points.push(p);
				var t = x;
				x = -y;
				y = t;
			}
//			mylog(j, points);
			gs.shape({p:points});
		}
	}

	gs.update();
	++time;
}
setInterval(pulse, 20);
