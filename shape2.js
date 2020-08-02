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

	if(true) {
		gs.color({rgb: [255, 0, 160]});
		var size=25;
		var x = size, y=size;
		var points = [];
		for(var i=0;i<4;++i) {
			var p = [];
			p.push(x,y);
			if(i==0) {
				p.push(mousex, mousey);
				if(cubic) p.push(-mousex, mousey);
			}
			points.push(p);
			var t = x;
			x = -y;
			y = t;
		}
		gs.shape({p:points});
	}
	if(true) {
		var size=25;
		var px=0.0;
		var py=-30.0;
		var points;
		var angle = time*.25;
		function pos(a, r) {
			a+=angle;
			a*=3.1415928/180.0;
			points.push([px+r*Math.cos(a), py+r*Math.sin(a)]);
		}
		function ship(r, side, rs) {
			pos(0, r);
			rs*=r;
			pos(180-side, rs);
			pos(180+side, rs);
		}
		function big() {ship(size, 30, 1.0);}
		function small() {ship(size*.84, 28, 1.0952);}
		points = [];
		points.push({rgb: [255,255,255]});
		big();
		points.push({rgb: [0,0,0]});
		small();
		gs.shape({p:points});
	}
	function posO(a, r) {
		r*=4.0;
		a*=3.1415928/180.0;
		return {x:r*Math.cos(a),y:50+r*Math.sin(a)};
	}
	function mix(p1, p2, f) {
		return {x:p1.x+(p2.x-p1.x)*f, y:p1.y+(p2.y-p1.y)*f};
	}
	function indent(a,b,c,f) {
		var ab = mix(a,b,f);
		var ac = mix(a,c,f);
		return mix(ab,ac,.5);
	}
	function dist(a,b) {
		var dx = a.x-b.x;
		var dy = a.y-b.y;
		return Math.sqrt(dx*dx + dy*dy);
	}
	function inCenter(a,b,c) {
		var sa = dist(b,c);
		var sb = dist(a,c);
		var sc = dist(a,b);
		var p = sa+sb+sc;
		return {x:(a.x*sa + b.x*sb + c.x*sc) / p,
				y:(a.y*sa + b.y*sb + c.y*sc) / p};
	}
	function add(a) {
		points.push([a.x, a.y]);
	}
	if(true) {
		var s=1.0;
		var side = 30;
		var angle = time*.25;
		var p1 = posO(angle+0, s);
		var p2 = posO(angle+180-side, s);
		var p3 = posO(angle+180+side, s);
		var points = [];
		gs.color({rgb: [255, 255, 255]});
		add(p1);
		add(p2);
		add(p3);
		gs.shape({p:points});
		gs.color({rgb: [0, 0, 0]});
		points = [];
		var f = .25;
		var c = inCenter(p1, p2, p3);
		add(mix(p1, c, f));
		add(mix(p2, c, f));
		add(mix(p3, c, f));
		gs.shape({p:points});
	}


	gs.update();
	++time;
}
setInterval(pulse, 20);
