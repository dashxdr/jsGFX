#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1200;
var down = false;
var mousex=0.0, mousey=0.0;
var mouse = {x:0.0, y:0.0};
gfx.setup({w:edge, h:edge});
var pos = [];
var iAmount=4;

var maxDist = 5.0;
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
	if(button==1) { // left button
		if(pressed) {
			var best = closest();
			if(best!==false) {
				down = best;
				move();
			}
		} else
			down = false;
	} else if(button==3) {
		if(pressed) insertPoint();
	}
});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
//mylog('code=' + code);
	if(code==gfx.k.ESC && pressed) gfx.quit();
	if(code==gfx.k.INSERT || code==gfx.asc(' ')) insertPoint(); // insert key
	if(code==gfx.k.DEL) deletePoint(); // delete key
	if(code==gfx.asc('h')) {
		mylog('--- Help ---');
		mylog('Insert key adds a point, also the right mouse button');
		mylog('Delete key deletes a point');
	}
});
gfx.on('wheel', function(v) {
//	mylog('wheel ' + v);
	iAmount+=v;
});
for(var i=0;i<3;++i) {
	var a = Math.PI*2*(.25 + i/3);
	var r = 85;
	pos[i] = {x:r*Math.cos(a), y:r*Math.sin(a)};
}

function mag(a) {return Math.sqrt(a.x*a.x + a.y*a.y);}
function norm(a) {
	var m = mag(a);
	var ret = {x:a.x, y:a.y};
	if(m>0.0) {
		m = 1.0/m;
		ret.x*=m;
		ret.y*=m;
	}
	return ret;
}
function sub(a,b) {return {x:a.x - b.x, y:a.y - b.y}};
function add(a,b) {return {x:a.x + b.x, y:a.y + b.y}};
function rot(a, degrees) {
	var radians = Math.PI*degrees/180.0;
	var c = Math.cos(radians);
	var s = Math.sin(radians);
	return {x:c*a.x + s*a.y, y:-s*a.x+c*a.y};
}
function dist(a,b) {
	var dx = a.x-b.x;
	var dy = a.y-b.y;
	return Math.sqrt(dx*dx + dy*dy);
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

function marker(p, color) {
	var r=1;
	gs.color({rgb: color});
	gs.disc({x:p.x, y:p.y, r:r});
	gs.color({rgb: [0, 0, 0]});
	gs.pen({r:.25*r});
	gs.circle({x:p.x, y:p.y, r:r});
}

function insertPoint() {
	pos.push({x:mouse.x, y:mouse.y});
}
function deletePoint() {
	var c = closest();
	if(c===false) return;
	pos = [].concat(pos.slice(0, c), pos.slice(c+1));
	down = false;
}
function outline(p, rgb) {
	var n = p.length;
	gs.pen({r:.25});
	gs.color({rgb: rgb});
	for(var i=0;i<n;++i) {
		var j = (i+1)%n;
		gs.vector({x:p[i].x, y:p[i].y, x2:p[j].x, y2:p[j].y});			
	}
}
function indent(p, d) {
	var p2 = [];
	var n = p.length;
	for(var i=0;i<n;++i) {
		var at = p[i];
		var next = p[(i+1)%n];
		var prev = p[(i+n-1)%n];
		var left = norm(sub(prev, at));
		var right = norm(sub(next, at));
		var center = norm(add(rot(left, 90), rot(right, -90)));
		var tr = center.x*right.x + center.y*right.y;
		var c = d/Math.sqrt(1.0 - tr*tr);
//		marker({x:at.x+center.x*c, y:at.y+center.y*c}, yellow);
//		marker({x:at.x+right.x*c*tr, y:at.y+right.y*c*tr}, yellow);
		p2.push({x:at.x + c*center.x, y:at.y + c*center.y});
	}
	return p2;
}

var t = 0.0;
function pulse() {
	gs.color({rgb: gfx.c.grey180});
	gs.clear();
	if(true) {
		outline(pos, gfx.c.black);
		outline(indent(pos, iAmount), gfx.c.white);

		var c = closest();
		pos.forEach(function(p, idx) {
			marker(p, (c===idx) ? gfx.c.green : gfx.c.red);
		});
	}
	gs.update();
	++t;
}
setInterval(pulse, 20);
