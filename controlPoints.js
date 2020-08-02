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
	if(code==27 && pressed) gfx.quit();
	if(code==gfx.k.INSERT) insertPoint(); // insert key
	if(code==gfx.k.DELETE) deletePoint(); // delete key
	if(code==gfx.asc('h')) {
		mylog('--- Help ---');
		mylog('Insert key adds a point, also the right mouse button');
		mylog('Delete key deletes a point');
	}
});
gfx.on('wheel', function(v) {
	mylog('wheel ' + v);
});
for(var i=0;i<3;++i) {
	var a = Math.PI*2*(.25 + i/3);
	var r = 85;
	pos[i] = {x:r*Math.cos(a), y:r*Math.sin(a)};
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
var t = 0.0;
function pulse() {
	gs.color({rgb: gfx.c.grey180});
	gs.clear();
	if(true) {
		var c = closest();
		pos.forEach(function(p, idx) {
			marker(p, (c===idx) ? gfx.c.green : gfx.c.red);
		});
	}
	gs.update();
	++t;
}
setInterval(pulse, 20);
