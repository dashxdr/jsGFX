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
var white = [255,255,255];
var red = [255,0,0];

function addOval(p, xc, yc, dx, dy, a, da, rot) {
	var x1, y1, x2, y2, x3, y3, x4, y4;
	var q1, q2, k2, ax, ay, bx, by;
	var AP_STEPS=3;

	a*=Math.PI/180.0;
	da*=Math.PI/180.0;
	rot*=Math.PI/180.0;
	var s = Math.sin(rot);
	var c = Math.cos(rot);

	var u00 = dx*c;
	var u01 = dy*s;
	var u10 = dx*s;
	var u11 = -dy*c;	

	var M_PI2 = Math.PI*2.0;
	da = Math.min(da, M_PI2);
	da = Math.max(da, -M_PI2);
	da/=AP_STEPS;
	for(var i=0;i<AP_STEPS;++i) {
		ax=Math.cos(a);
		ay=-Math.sin(a);
		a+=da;
		bx=Math.cos(a);
		by=-Math.sin(a);

		x1=ax;
		y1=ay;
		x4=bx;
		y4=by;

		q1=ax*ax + ay*ay;
		q2=q1 + ax*bx + ay*by;
		k2 = 4.0/3.0*((Math.sqrt(2.0*q1*q2)-q2)/(ax*by-ay*bx));
		x2=x1 - k2*ay;
		y2=y1 + k2*ax;
		x3=x4 + k2*by;
		y3=y4 - k2*bx;
		p.push([xc+u00*x1+u01*y1, yc+u10*x1+u11*y1,
			xc+u00*x2+u01*y2, yc+u10*x2+u11*y2,
			xc+u00*x3+u01*y3, yc+u10*x3+u11*y3]);
		if(i+1==AP_STEPS)
			p.push([xc+u00*x4+u01*y4, yc+u10*x4+u11*y4]);
	}
}


var time = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	if(true) {
		gs.color({rgb: [255, 180, 0]});
		var size=25;
		var bigger = -5;
		var x, y;
		var points = [];

		for(var j=0;j<2;++j) {
			x = y = size + j*bigger;
			points.push({rgb:j==0?white:red});
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
	if(true) {
		var points = [];
		for(var j=0;j<2;++j) {
			points.push({rgb:j==0?white:red});
			var s = 1.0 - .1*j;
//addOval(p, xc, yc, dx, dy, a, da, rot)
			var cx = -50;
			var cy = -50;
			points.push([cx, cy]);
			addOval(points, cx, cy, 25*s, 20*s, 0, -180, time);
		}
		gs.shape({p:points});
	}

	gs.update();
	++time;
}
setInterval(pulse, 20);
