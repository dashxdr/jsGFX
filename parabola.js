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
var sneaky = true;

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
	if(code==gfx.asc(' ')) sneaky = !sneaky;
	if(code==gfx.asc('h')) {
		mylog('--- Help ---');
		mylog('Insert key adds a point, also the right mouse button');
		mylog('Delete key deletes a point');
		mylog('spacebar toggles sneaky flag, showing internal stuff');
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

function mag(a, b) {return Math.sqrt(a.x*a.x + a.y*a.y);}
function norm(a) {
	var m = mag(a);
	m = m ? 1.0/m : 1.0;
	return {x:a.x*m, y:a.y*m};
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
// quadratic bezier curve interpolation
function quadratic(p1, p2, p3, t) {
	var ot = 1.0 - t;
	var a = ot*ot;
	var b = 2.0*t*ot;
	var c = t*t;
	return {x:a*p1.x + b*p2.x + c*p3.x, y:a*p1.y + b*p2.y + c*p3.y};
}
function quadraticDt(p1, p2, p3, t) {
	t *= 2.0;
	var ot = 2.0 - t;
	return {x:ot*(p2.x-p1.x) + t*(p3.x-p2.x), y:ot*(p2.y-p1.y) + t*(p3.y-p2.y)};
}
// Find "center" 't' of bezier curve, that is, where B'(t) DOT B''(t) == 0
function qCenter(p1, p2, p3) {
		var t21x = p2.x - p1.x;
		var t21y = p2.y - p1.y;
		var t32x = p3.x - p2.x;
		var t32y = p3.y - p2.y;
		var t321x = t32x - t21x;
		var t321y = t32y - t21y;
		var A = t21x * t321x + t21y * t321y;
		var B = t32x * t321x + t32y * t321y;
		return A!=B && A/(A-B);
}
function drawBezier(p1, p2, p3, rgb) {
	var points = [];
	points.push({rgb:rgb});
	var tx = .25;
	var ty = 0.0;
	var c = qCenter(p1, p2, p3);
	if(c!==false) {
		var cp = quadratic(p1, p2, p3, c);
		var d = norm(quadraticDt(p1, p2, p3, c));
		var s = .5;
		d.x*=s;
		d.y*=s;
		tx = -d.y;
		ty = d.x;
		if(sneaky) {
			var f = 10.0;
			marker({x:cp.x + f*d.x, y:cp.y + f*d.y}, gfx.c.cyan);
		}
	}
	push3(p1,p2,p3,tx, ty);
	push3(p3,p2,p1,-tx, -ty);
	function push3(u,v,w,dx,dy) {
		points.push([u.x+dx, u.y+dy, v.x+dx, v.y+dy]);
		points.push([w.x+dx, w.y+dy]);
	}
	gs.shape({p:points});
}
var t = 0.0;
function pulse() {
	gs.color({rgb: gfx.c.grey180});
	gs.clear();

	if(pos.length>=3) {
		var tp0 = pos[0];
		var tp1 = {x:pos[1].x, y:pos[1].y};
		var tp2 = pos[2];
		tp1.x = 2*tp1.x - (tp0.x + tp2.x) * .5;
		tp1.y = 2*tp1.y - (tp0.y + tp2.y) * .5;
		if(sneaky)
			marker(tp1, gfx.c.orange); // quadratic bezier control point
		drawBezier(tp0, tp1, tp2, gfx.c.black);
		if(sneaky) {
// shows center of bezier's parabola
			var c = qCenter(tp0, tp1, tp2);
			if(c!==false)
				marker(quadratic(tp0, tp1, tp2, c), gfx.c.blue);
		}
	}
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
