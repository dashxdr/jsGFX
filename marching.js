#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
var step1 = 1;
var step2 = 1;
var p1 = 0;
var p2 = 0;
var toggle = false;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
	if(code==32 && pressed) {
		toggle = !toggle;
		if(toggle) step1=-step1;
		else step2=-step2;
	}
});
var t = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	gs.color({rgb: [255, 255, 255]});
	var r = 20;
	function dot(x,y) {
		gs.disc({x:x, y:y, r:4});
//		gs.box({x:x, y:y, dx:4, dy:4});
	}
	function row(n, pct, a) {
		var x = 0;
		var y = 0;
		var a2 = a + 3.1415927*3/4;
		var r2 = r*n*Math.sqrt(2);
		var dx = r*Math.cos(a);
		var dy = r*Math.sin(a);
		x+=r2*Math.cos(a2) + dx*pct;
		y+=r2*Math.sin(a2) + dy*pct;
		dot(x, y);
		n+=n-1;
		while(n-- > 0) {
			x+=dx;
			y+=dy;
			dot(x,y);
		}
	}
	function box(n, pct) {
		if(n==0) {
			row(n, 0, 0);
			return;
		}
		row(n, pct, 0);
		row(n, pct, 3.1415927/2);
		row(n, pct, 3.1415927);
		row(n, pct, 3.1415927*1.5);
	}
	function pct(x) {
		x*=.01;
		return x - Math.floor(x);
	}
	var pct1 = pct(p1);
	var pct2 = pct(p2);
	p1 += step1;
	p2 += step2;
	box(0, pct1);
	box(1, pct2);
	box(2, pct1);
	box(3, pct2);
	box(4, pct1);

	gs.update();
	++t;
}
setInterval(pulse, 20);
