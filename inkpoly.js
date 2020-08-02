#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1200;
var mouse = {x:0.0, y:0.0};
var pause = false;
var down = false;
var maxDist = 5;
var cp = [
	{
		x:0.0,
		y:0.0,
		dx: 4.0,
		dy: -3.7438174,
		rgb: [0, 255, 0],
	},
	{
		x: -100.0 + 100.0/16.0,
		y: 0.0,
		dx: 3.77282848,
		dy: 4.0,
		rgb: [0, 0, 255],
	},
];

gfx.setup({w:edge, h:edge});
function move() {
	cp[down].x = mouse.x;
	cp[down].y = mouse.y;
}
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
gfx.on('motion', function(x, y) {
	mouse = {x:x,y:y};
	if(down!==false)
		move();
});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code==gfx.asc(' ')) pause=!pause;
	if(code==gfx.asc('-')) reverse();
});
var time = 0.0;
function inkpoly(cp) {
	var p1 = cp[0];
	var p2 = cp[1];
	var px = p1.x;
	var py = p1.y;
	var px2 = p2.x;
	var py2 = p2.y;
	var n = 20;
	var cd = py;//px*py/100.0;
	var r = 95.0;
	var r2 = r*(px2+100.0)/200.0;
	var da = Math.PI*2.0/n;
	var halfpi = Math.PI*.5;
	var cx = 0.0;
	var cy = 0.0;
	var p = [];
	var a = -da/2;
	var a2 = Math.PI*2.0*px/100;
	var x2 = cx+r2*Math.cos(a2-da);
	var y2 = cy-r2*Math.sin(a2-da);
	for(var i=0;i<n;++i) {
		var x1 = cx+r*Math.cos(a);
		var y1 = cy-r*Math.sin(a);
		var tx1 = cd*Math.cos(a-halfpi);
		var ty1 = -cd*Math.sin(a-halfpi);
		var tx2 = cd*Math.cos(a2-halfpi);
		var ty2 = -cd*Math.sin(a2-halfpi);
		p.push([x2, y2, cx+r2*Math.cos(a2-da) - cd*Math.cos(a2-da-halfpi), cy-r2*Math.sin(a2-da) + cd*Math.sin(a2-da-halfpi),
				x1+tx1, y1+ty1]);
		x2 = cx+r2*Math.cos(a2);
		y2 = cy-r2*Math.sin(a2);
		p.push([x1, y1, x1-tx1, y1-ty1, x2 + tx2, y2 + ty2]);
		a += da;
		a2 += da;
	}
	gs.color({rgb: [255, 0, 0]});
	gs.shape({p:p});
}
function dist(a,b) {
	var dx = a.x-b.x;
	var dy = a.y-b.y;
	return Math.sqrt(dx*dx + dy*dy);
}

function reverse() {
	function rev1(p) {
		p.dx = -p.dx;
		p.dy = -p.dy;
	}
	cp.forEach(function(p) {rev1(p);});
}
function bounce(p) {
	if(down!==false && cp[down]===p) return;
	var limit = 100.0;
	var speed = 0.04;
	p.x+=p.dx*speed;
	if(p.x<=-limit || p.x>=limit) p.dx = -p.dx;
	p.y+=p.dy*speed;
	if(p.y<=-limit || p.y>=limit) p.dy = -p.dy;
}
function closest() {
	var best = false;
	cp.forEach(function(p, ndx) {
		if(best===false || dist(mouse,p) < dist(mouse,cp[best]))
			best = ndx;
	});
	if(best!==false && dist(mouse, cp[best]) > maxDist) best = false;
	return best;
}
function marker(p) {
	var r = 1.0;
	gs.color({rgb: p.rgb});
	gs.disc({x:p.x, y:p.y, r:r});
	gs.color({rgb: [0, 0, 0]});
	gs.pen({r:r*.125});
	gs.circle({x:p.x, y:p.y, r:r});
	}
function pulse() {
	gs.color({rgb: [255, 255, 255]});
	gs.clear();

	if(true) {
		inkpoly(cp);
		if(!pause) {
			cp.forEach(bounce);
		}
		cp.forEach(marker);
	}

	gs.update();
	++time;
}
setInterval(pulse, 20);
