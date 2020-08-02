#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1200;
var mousex=0.0, mousey=0.0;
var cubic = false;
var adjusting = 5;
var down = false;
var adjusts = false;
var max = 1;
gfx.setup({w:edge, h:edge});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
gfx.on('button', function(button, pressed, x, y) {
	down = pressed;
//mylog('button=' + button, 'pressed=' + pressed, 'x=' + x, 'y=' + y);
});
function asc(c) {return c.charCodeAt(0);}
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code==32) cubic=!cubic;
	if(code>=49 && code<=57) {
		if(mod) max=code-48;
		else adjusting = code-49;
	}
	if(code==asc('r')) mylog(adjusts);
});
var time = 0.0;

function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	var origin = {x:0.0, y:0.0};
	var zoom = {x:50.0, y:50.0};
	var originPos = {x:-90.0, y:-90.0};
	function fix(x,y) {
		x=(x-origin.x)*zoom.x+originPos.x;
		y=(y-origin.y)*zoom.y+originPos.y;
		return {x:x, y:y};
	}
	function fixp(p) {return fix(p.x, p.y);}
	function unfix(x,y) {
		x = (x-originPos.x)/zoom.x + origin.x;
		y = (y-originPos.y)/zoom.y + origin.y;
		return {x:x, y:y};
	}

	function box(x,y,w,h,pen,color) {
		if(pen!==undefined) gs.pen({r:pen});
		if(color===undefined) color = [255,255,255];
		gs.color({rgb: color});
		var p1 = fix(x,y);
		var p2 = fix(x+w, y+h);
		gs.vector({x:p1.x, y:p1.y, x2:p2.x, y2:p1.y});
		gs.vector({x:p2.x, y:p1.y, x2:p2.x, y2:p2.y});
		gs.vector({x:p2.x, y:p2.y, x2:p1.x, y2:p2.y});
		gs.vector({x:p1.x, y:p2.y, x2:p1.x, y2:p1.y});
	}

	box(0,0,1,1,.5);
	function graph(f, rgb) {
		if(rgb) gs.color({rgb:rgb});
		gs.pen({r:.25});
		var last = false;
		for(var x=0;x<=2;x+=.025) {
			var y = f(x);
			var p = fix(x,y);
			if(last) {
				gs.vector({x:last.x, y:last.y, x2:p.x, y2:p.y});
			}
			last = p;
		}
	}
	if(1) { // graph of y=x^2+1
		graph(function(x) {return x*x+1.0;}, [255, 255, 255]);
	}
	if(1) {
		graph(function(x) {return Math.pow(x, 1.414213562) + 1.0/(x+1.56);});
	}
	if(1) { // which point we're adjusting

	}
	function dot(p) {
		var t = fix(p.x,p.y);
		gs.disc({x:t.x, y:t.y, r:1.0});
	}

	function line(p1, p2) {
		var t1 = fixp(p1);
		var t2 = fixp(p2);
		gs.vector({x:t1.x, y:t1.y, x2:t2.x, y2:t2.y});
	}
	function next(p) {
		return {x:p.y, y:p.x*p.x+1};
	}
	function show(p, rgb) {
		if(!rgb) rgb = [255, 0, 0];
		gs.color({rgb: rgb});
		gs.pen({r:.25});
		function doit() {
			var n=next(p);
			line(p, n);
			dot(p);
			p=n;
		}
		doit();
		doit();
		doit();
		doit();
		dot(p);
	}
	function mix(p1, p2, f) {
		return {x:p1.x+(p2.x-p1.x)*f, y:p1.y+(p2.y-p1.y)*f};
	}

	if(!adjusts) adjusts = // [ 0.63, 0.9079754601226995, 1, 1, 1, 1, 1, 1];
		[ 0.64,
		  0.8965995895105228,
		  0.9669056648938431,
		  0.9898285478027286,
		  1.001474481016127,
		  0.9999999844359126,
		  1,
		  1 ]

	if(1) {
		var m = unfix(mousex, mousey);
		var first;
		var last;
		for(var i=0;i<=adjusting;++i) {
			var p;
			if(i==0) {
				if(down && i==adjusting) adjusts[i]=m.y;
				p={x:0.0, y:adjusts[i]};
				first = p;
				last = next(p);
			} else {
				p = mix(first, last, .5);
				if(down && i==adjusting) adjusts[i]=m.y/p.y;	
				p.y *= adjusts[i];
				last = p;
			}
			show(p, (i==adjusting) ? [0, 255, 0] : [255, 0, 0]);
		}

//		var p1 = unfix(mousex, mousey);
//		p1.x = 0;
//		show(p1, [255, 0, 0]);
//		var p2 = next(p1);
//		p2.x = (p1.x + p2.x)*.5;
//		p2.y = (p1.y + p2.y)*.5;
//		show(p2, [0, 255, 0]);
	}

	if(false) {
		gs.color({rgb: [255, 0, 160]});
		var size=25;
		var x = size, y=size;
		var points = [];
		for(var i=0;i<4;++i) {
			var p = [];
			if(i==1) {
				p.push(mousex);
				p.push(mousey);
				if(cubic) {
					p.push(-mousex);
					p.push(mousey);
				}
			}
			p.push(x);
			p.push(y);
			points.push(p);
			var t = x;
			x = -y;
			y = t;
		}
		gs.shape({p:points});
	}
	if(false) {
		var size=25;
		var px=0.0;
		var py=-30.0;
		var points;
		var angle = time;
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
		points = [];
		gs.color({rgb: [255, 255, 255]});
		ship(size, 30, 1.0);
		gs.shape({p:points});

		points = [];
		gs.color({rgb: [0, 0, 0]});
		ship(size*.84, 28, 1.0952);
		gs.shape({p:points});
	}


	gs.update();
	++time;
}
setInterval(pulse, 25);
