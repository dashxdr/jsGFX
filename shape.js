#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1200;
var mousex=0.0, mousey=0.0;
var controlPoints = 1;
gfx.setup({w:edge, h:edge});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code==32) controlPoints = (controlPoints+1)%3;
	if(code>=gfx.asc('0') && code<=gfx.asc('2'))
		controlPoints = code - gfx.asc('0');
});
var time = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	if(true) {
		gs.color({rgb: [255, 180, 0]});
		var size=25;
		var bigger = 5;
		var x, y;
		var points = [];

		for(var j=0;j<5;++j) {
			x = y = size + j*bigger;
			for(var i=0;i<4;++i) {
				var p = [];
				p.push(x, y);
				var mx2 = mousex*2;
				var my2 = mousey*2;
				if(i==0) {
					if(controlPoints>0) p.push(mx2, my2);
					if(controlPoints>1) p.push(-mx2, my2);
				}
				points.push(p);
				var t = x;
				x = -y;
				y = t;
			}
			points.push([]);
		}
//mylog(points);
		gs.shape({p:points});
	}
	gs.update();
	++time;
}
setInterval(pulse, 20);
