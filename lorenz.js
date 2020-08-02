#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
var mouse = {x:0,y:0};
gfx.setup({w:edge*1.5, h:edge});
var toggle = true;
var clearing = true;
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code==gfx.asc('c')) clearing = !clearing;
	if(code==gfx.asc(' ')) toggle = !toggle;
});
gfx.on('motion', function(x, y) {mouse.x = x;mouse.y=y;});
var t = 0.0;
var first = true;
var x, y, z;
var oldx, oldy;
var count=0;
var minz=0, maxz=1;
var angle;
function pulse() {
	if(clearing || first) {
		gs.color({rgb: [0, 0, 0]});
		gs.clear();
		first = false;
		x=y=Math.sqrt(72);
		z=27;
//x=y=z=1;
		count=0;
		angle = mouse.x+mouse.y;
	}

	gs.color({rgb: [255, 255, 255]});
	var d = .25;
	var scale = 4;
	gs.pen({r:.025*2});
	var a = angle*.1;
	var s = Math.sin(a);
	var c = Math.cos(a);
	var min=10000;
	var max=-10000;
	var factor = 1/(maxz-minz);
	var sub = minz;
	for(var i=0;i<5000;++i) {
		var dx = 10*(y-x);
		var dy = 28*x - y - x*z;
		var dz = x*y - 8*z/3;
		var f = d/Math.sqrt(dx*dx+dy*dy+dz*dz);
		x+= dx*f;
		y+= dy*f;
		z+= dz*f;
		var zc = z-25;
		var newx, newy, newz;
		if(toggle) {
			newx = (x*c + y*s)*scale;
			newy = zc*scale;
			newz = (-x*s + y*c);
		} else {
			newx = x*scale;
			newy = (zc*c + y*s)*scale
			newz = (-zc*s + y*c);
		}
		if(newz<min) min=newz;
		if(newz>max) max=newz;
var color = (newz-sub)*factor;
color = 32 + color*192;
if(color<0) color=0;
if(color>255) color=255;
var p = 50;p=p/(p+newz);
newx*=p;
newy*=p;
color=255-color;
gs.color({rgb:[color,color,color]});
		if(count++>0)
			gs.vector({x:oldx, y:oldy, x2:newx, y2:newy});
		oldx=newx;
		oldy=newy;
	}
	minz=min;
	maxz=max;

	gs.update();
	++t;
}
setInterval(pulse, 20);
