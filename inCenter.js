#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1200;
var down = false;
var mousex=0.0, mousey=0.0;
var mouse;
var showCC = true;
gfx.setup({w:edge, h:edge});
var pos = [];
var white = [255,255,255];
var green = [0,255,0];
var red = [255,0,0];
var yellow = [255,255,0];
var black = [0,0,0];
var maxIndent = 20;
var indent = 2;
gfx.on('motion', function(x, y) {
	mousex = x;mousey = y;
	mouse = {x:x, y:y};
	if(down!==false)
		pos[down] = mouse;
});
gfx.on('button', function(button, pressed, x, y) {
	if(pressed) {
		var best = false;
		pos.forEach(function(p, ndx) {
			if(best===false || dist(mouse,p) < dist(mouse,best)) {
				down = ndx;
				best = p;
			}
		});
		pos[down] = mouse;
	} else
		down = false;
});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==27 && pressed) gfx.quit();
	if(code==gfx.asc('c')) showCC = !showCC;
});
gfx.on('wheel', function(v) {
	indent += v;
	if(indent>maxIndent) indent=maxIndent;
	if(indent<0) indent=0;
});
for(var i=0;i<3;++i) {
	var a = Math.PI*2*(.25 + i/3);
	var r = 85;
	pos[i] = {x:r*Math.cos(a), y:r*Math.sin(a)};
}


function marker(p, color) {
	var r=1;
	gs.color({rgb: color});
	gs.disc({x:p.x, y:p.y, r:r});
	gs.color({rgb: [0, 0, 0]});
	gs.pen({r:.25*r});
	gs.circle({x:p.x, y:p.y, r:r});
}
function mix(p1, p2, f) {
	return {x:p1.x+(p2.x-p1.x)*f, y:p1.y+(p2.y-p1.y)*f};
}
function dist(a,b) {
	var dx = a.x-b.x;
	var dy = a.y-b.y;
	return Math.sqrt(dx*dx + dy*dy);
}
function mag(a) {return Math.sqrt(a.x*a.x + a.y*a.y);}

function inCenter(a,b,c) {
	var sa = dist(b,c);
	var sb = dist(a,c);
	var sc = dist(a,b);
	var p = sa+sb+sc;
	return {x:(a.x*sa + b.x*sb + c.x*sc) / p,
			y:(a.y*sa + b.y*sb + c.y*sc) / p};
}
function circumCenter(a,b,c) {
	var d = 2.0 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y-b.y));
	var a2 = a.x*a.x + a.y*a.y;
	var b2 = b.x*b.x + b.y*b.y;
	var c2 = c.x*c.x + c.y*c.y;

	return {x:(a2*(b.y-c.y) + b2*(c.y-a.y) + c2*(a.y-b.y)) / d,
			y:(a2*(c.x-b.x) + b2*(a.x-c.x) + c2*(b.x-a.x)) / d};
}
function distLine(a,b,c) { // distance between point a and line bc
	var ta = {x:a.x-c.x, y:a.y-c.y};
	var tb = {x:b.x-c.x, y:b.y-c.y};
	var mtb = mag(tb);
	if(mtb == 0.0) return mag(ta);
	return Math.abs((ta.x*tb.y - ta.y*tb.x)/mtb);
}

var t = 0.0;
function pulse() {
	gs.color({rgb: gfx.c.grey180});
	gs.clear();
	if(true) {
		var points = [];
		pos.forEach(function(p) {points.push([p.x, p.y])});
		gs.color({rgb: white});
		gs.shape({p:points});

		var c = inCenter(pos[0], pos[1], pos[2]);
		var cc = circumCenter(pos[0], pos[1], pos[2]);
		points = [];
		pos.forEach(function(p) {
			p = mix(p, c, indent/maxIndent);
			points.push([p.x, p.y]);
		});
		gs.color({rgb: gfx.c.grey200});
		gs.shape({p:points});

		marker(c, red);
		gs.color({rgb: black});
		gs.pen({r:.25});
		if(showCC) {
			gs.circle({x:cc.x, y:cc.y, r:dist(cc, pos[0])});
		}
		gs.circle({x:c.x, y:c.y, r:distLine(c, pos[0], pos[1])});
		for(var i=0;i<3;++i) {
			var j = (i+1)%3;
			gs.vector({x:pos[i].x, y:pos[i].y, x2:pos[j].x, y2:pos[j].y});
//			if(showCC)
//				gs.vector({x:pos[i].x, y:pos[i].y, x2:cc.x, y2:cc.y});
		}
		pos.forEach(function(p) {
			marker(p, green);
		});
		if(showCC) marker(cc, yellow);
	}
	gs.update();
	++t;
}
setInterval(pulse, 20);
