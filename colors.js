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
var oldid = -1;
function pulse() {
	gs.color({rgb: [255, 255, 255]});
	gs.clear();

	var colors = Object.keys(gfx.c);
	var len = colors.length;
	var s = Math.floor(Math.sqrt(len))+1;
	var a = .1;
	function fix(v) {return 200*v-100;}
	var id = -1;
	for(var i=0;i<len;++i) {
		var y = Math.floor(i/s);
		var x = i-y*s;
		var x1 = fix((x+a)/(s+a));
		var x2 = fix((x+1)/(s+a));
		var y1 = fix((y+a)/(s+a));
		var y2 = fix((y+1)/(s+a));
		var p = [];
		p.push([x1,y1]);
		p.push([x2,y1]);
		p.push([x2,y2]);
		p.push([x1,y2]);
		gs.color({rgb:gfx.c[colors[i]]});
		gs.shape({p});
		if(mouse.x>=x1 && mouse.x<=x2 && mouse.y>=y1 && mouse.y<=y2) id=i;
	}
	if(id!=oldid && id>=0) {
		var arr = gfx.c[colors[id]];
		function hex2(v) {
			v = v.toString(16);
			if(v.length==1) v='0'+v;
			return v;
		}
		var h = '#' + hex2(arr[0]) + hex2(arr[1]) + hex2(arr[2]);
		mylog(colors[id], '[' + arr.join(',') + ']', h);
	}
	oldid = id;

	gs.update();
	++t;
}
setInterval(pulse, 20);
