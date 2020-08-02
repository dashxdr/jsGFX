#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
var toggle1 = true;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
	if(code>=48 && code<=57 && pressed) {sides = 3+code-48;pos=0;}
	if(code==32 && pressed) {toggle1 = !toggle1;pos=0;}
});
var t = 0.0;
var pos = 0.0;
var sides = 3;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	var PI2 = 3.1415927*2.0;
	gs.color({rgb: [255, 255, 255]});
	var dt1 = .04;
	var p = t * dt1;
	var r1 = toggle1 ? 4 : 8;
	r1*=5;
	var r2 = 60;
	var pa = PI2/sides;
	var len = r1*Math.sqrt(2*(1-Math.cos(pa)));
	var r21 = r2-r1;
	var angle1 = len / r21;
	var angle2 = pa;
	var l1 = pos % (angle1 + angle2);
	var n = Math.floor(pos/(angle1+angle2));
	var a = n*angle1 + Math.min(angle1, l1);
	var cos = Math.cos(a);
	var sin = Math.sin(a);
	var dx = -sin;
	var dy = cos;
	var xt = r21*cos;
	var yt = r21*sin;
	var px = xt;
	var py = yt;
	var ta = a-PI2/4;
	var da = angle1-l1;
	if(da>0) {
		var f = len*da/angle1;
		px += dx*f;
		py += dy*f;
	} else {
		ta -= da;
	}

	var p = [];
	for(var i=0;i<sides;++i) {
		p.push([px, py]);
		px += len*Math.cos(ta);
		py += len*Math.sin(ta);
		ta += pa;
	}
	gs.shape({p:p});

	gs.color({rgb: [0, 255, 0]});
	gs.disc({x:0, y:0, r:r2-r1});

	gs.color({rgb: [255, 0, 0]});
	gs.disc({x:xt, y:yt, r:1});

	gs.update();
	pos += dt1;
	++t;
}
setInterval(pulse, 20);
