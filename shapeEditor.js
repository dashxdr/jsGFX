#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1200;
var down = false;
var mousex=0.0, mousey=0.0;
var mouse = {x:0.0, y:0.0};
var showCC = true;
gfx.setup({w:edge, h:edge});
var pos = [];

var maxIndent = 20;
var maxDist = 5.0;
var indent = 2;
function move() {
	pos[down].x = mouse.x;
	pos[down].y = mouse.y;
}

gfx.on('motion', function(x, y) {
	mousex = x;mousey = y;
	mouse = {x:x, y:y};
	if(down!==false)
		move();
});
gfx.on('button', function(button, pressed, x, y) {
	if(pressed) {
		var best = closest();
		if(best!==false) {
			down = best;
			move();
		}
	} else
		down = false;
});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
//mylog('code=' + code);
	if(code==gfx.k.ESC) gfx.quit();
	if(code==gfx.asc('c')) showCC = !showCC;
	if(code==gfx.k.INSERT) insertPoint(); // insert key
	if(code==gfx.k.DEL) deletePoint(); // delete key
	if(code==gfx.asc(' ')) toggle();
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

function closest() {
	var best = false;
	pos.forEach(function(p, ndx) {
		if(best===false || dist(mouse,p) < dist(mouse,pos[best]))
			best = ndx;
	});
	if(best!==false && dist(mouse, pos[best]) > maxDist) best = false;
	return best;
}
function closestOnPath() {
	var n = pos.length;
	if(n<2) return false;
	var far = 999999;
	var ret = false;
	for(var i=0;i<n;++i) {
		var j = (i+1)%n;
		var p1 = pos[i];
		var p2 = pos[j];
		var d = distToLine(mouse, p1, p2);
		if(d<far) {
			far = d;
			ret = {p:mix(p1, p2, .5), idx:i};
		}
	}
	return ret;
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

function distToLine(a,b,c) { // distance between point a and line bc
	var ta = {x:a.x-c.x, y:a.y-c.y};
	var tb = {x:b.x-c.x, y:b.y-c.y};
	var mtb = mag(tb);
	if(mtb == 0.0) return mag(ta);
	return Math.abs((ta.x*tb.y - ta.y*tb.x)/mtb);
}
function insertPoint() {
	var cop = closestOnPath();
	if(!cop) return;
//	mylog('Inserting after ' + cop.idx);
	pos = [].concat(pos.slice(0, cop.idx+1), [cop.p], pos.slice(cop.idx+1));
}
function deletePoint() {
	var c = closest();
	if(c===false) return;
	pos = [].concat(pos.slice(0, c), pos.slice(c+1));
}

function toggle() {
	var c = closest();
	if(c===false) return;
	var p = pos[c];
	p.offPath = !p.offPath;
}
var t = 0.0;
var lastClosest = false;
function pulse() {
	gs.color({rgb: gfx.c.grey180});
	gs.clear();
	if(true) {
		var points = [];
		var pt = [];
		pos.forEach(function(p) {
			if(p.offPath) {
				if(pt.length) pt.push(p.x, p.y);
			} else {
				if(pt.length) points.push(pt);
				pt = [p.x, p.y];
			}
		});
		if(pt.length) points.push(pt);
		gs.color({rgb: gfx.c.white});
		gs.shape({p:points});

		gs.color({rgb: gfx.c.black});
		gs.pen({r:.25});
		pos.forEach(function(p) {
			marker(p, p.offPath ? gfx.c.red : gfx.c.green);
		});
		var c = closest();
		if(c!==lastClosest) {
			lastClosest = c;
//			mylog('Closest = ' + lastClosest);
		}
		if(c!==false) {
			c = pos[c];
			gs.color({rgb: [255, 255, 255, 64]});
			gs.disc({x:c.x, y:c.y, r:maxDist});
		}
//		var cop = closestOnPath();
//		if(cop)
//			marker(cop.p, orange);

	}
	gs.update();
	++t;
}
setInterval(pulse, 20);
