#!/usr/bin/env node
"use strict";

// Exploring Fortune's Algorithm
// https://en.wikipedia.org/wiki/Fortune%27s_algorithm

var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1024;
var down = false;
var mouse = {x:0.0, y:0.0};
gfx.setup({w:edge, h:edge});
var limit = 100.0;
var pos = [];
var bruteForce = false;
var showGhost = false;
var ab = false;
var lockXPos = false;

var maxDist = 5.0;
function move() {
	pos[down].x = mouse.x;
	pos[down].y = mouse.y;
}

gfx.on('motion', function(x, y) {
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
	if(code==gfx.k.INSERT || code==gfx.asc(' ')) insertPoint(); // insert key or space
	if(code==127) deletePoint(); // delete key
	if(code==gfx.asc('b')) {
		bruteForce = !bruteForce;
		mylog('bruteForce ' + bruteForce);
	}
	if(code==gfx.asc('r')) preset(0);
	if(code==gfx.asc('g')) showGhost = !showGhost;
	if(code==gfx.asc('a')) ab = !ab;
	if(code==gfx.asc('d')) dump();
	if(code==gfx.asc('l')) lockXPos = !lockXPos && mouse.x;
	if(code>=gfx.asc('0') && code<=gfx.asc('9')) preset(code - gfx.asc('0'));
	if(code==gfx.asc('h')) {
		mylog('--- Help ---');
		mylog('Insert key adds a point, also the right mouse button');
		mylog('Delete key deletes a point');
		mylog('b toggles brute force');
		mylog('l toggles locking xpos');
		mylog('r randomizes points');
		mylog('g toggles showGhost');
		mylog('d dump current pos array');
		mylog('1-9 preset load');
		mylog('a toggles ab');
	}
});
gfx.on('wheel', function(v) {
	mylog('wheel ' + v);
});
function randomize(n) {
	var count = n;
	pos = [];
	for(var i=0;i<count;++i) {
		for(;;) {
			var np = {x:randS(limit), y:randS(limit)};
			var unique = true;
			pos.forEach(function(p) {
				if(dist(p, np) < 3) unique = false;
			});
			if(!unique) continue;
			pos[i] = np;
			break;
		}
	}
}
function dump() {mylog(pos);}
function preset(n) {
	if(n==0) randomize(15);
	else if(n==1) pos = [ { x: -63.28125, y: -26.5625 },
		{ x: -64.453125, y: 28.515625 },
		{ x: -83.203125, y: 2.34375 } ];
	else if(n==2) pos = [ { x: -36, y: 55 },
  { x: 63, y: -63 },
  { x: -3, y: -19 },
  { x: -12, y: 65 },
  { x: -50, y: 82 },
  { x: 90, y: -64 },
  { x: 62, y: 52 },
  { x: -23, y: 17 },
  { x: -91, y: -12 },
  { x: 94, y: -6 },
  { x: -92, y: 3 },
  { x: -69, y: 90 },
  { x: -87, y: -97 },
  { x: -55, y: 37 },
  { x: -28, y: 10 } ];
	else if(n==3) randomize(100);
	else if(n==4) randomize(200);
	else if(n==5) randomize(500);

}
preset(0);

function rand(x) {return Math.floor(Math.random()*x);}
function randS(x) {return rand(x*2.0)-x;}

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
	var unique = true;
	pos.forEach(function(p) {
		if(p.x == mouse.x && p.y == mouse.y) {
			unique = false;
		}
	});
	if(unique)
		pos.push({x:mouse.x, y:mouse.y});
}
function deletePoint() {
	var c = closest();
	if(c===false) return;
	pos = [].concat(pos.slice(0, c), pos.slice(c+1));
	down = false;
}
var t = 0.0;
function show(list, rgb) {
	list.forEach(function(p) {
		marker(p, rgb);
	});
}
function hline(y) {gs.vector({x:-limit, y:y, x2:limit, y2:y});}
function vline(x) {gs.vector({x:x, y:-limit, x2:x, y2:limit});}
function parabolaCross(p1, p2, xpos) {
	var h = xpos - p1.x;
	var w = p2.y - p1.y;
	var h2 = xpos - p2.x;
	var a = h2 - h;
	var b = 2*h*w;
	var c = h2*h*h - h*h2*h2 - h*w*w;
	var i = b*b-4*a*c;
	function plot(x) {return {x:xpos-(x*x+h*h)/(h*2), y:x+p1.y};}
	var ret = [];
	if(i>=0.0) {
		if(a==0.0) ret.push(plot(-c/b));
		else {
			i = Math.sqrt(i);
			ret.push(plot((-b + i)/(2*a)));
			if(i!=0.0)
				ret.push(plot((-b - i)/(2*a)));
		}
	}
	return ret;
}
function circumCenter(a,b,c) {
	var d = 2.0 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y-b.y));
	var a2 = a.x*a.x + a.y*a.y;
	var b2 = b.x*b.x + b.y*b.y;
	var c2 = c.x*c.x + c.y*c.y;

	return {x:(a2*(b.y-c.y) + b2*(c.y-a.y) + c2*(a.y-b.y)) / d,
			y:(a2*(c.x-b.x) + b2*(a.x-c.x) + c2*(b.x-a.x)) / d};
}
// parabola where minimum is at (X0,Y0) is y=(x^2-2X0x+X0^2+Y0^2)/(2Y0)
// a = 1/(2Y0)
// b = X0/Y0
// c =(X0^2+Y0^2)/(2Y0)
// https://math.stackexchange.com/questions/335226/convert-segment-of-parabola-to-quadratic-bezier-curve
function drawParabola(p, xpos, x1, x2, rgb) {
	var x0 = p.y;
	var y0 = xpos - p.x;
	var a = 1.0/(2.0*y0);
	var b = -x0/y0;
	var c = (x0*x0+y0*y0)/(2.0*y0);
	function f(x) {return xpos - ( a*x*x + b*x + c);}
	var points = [];
	var p1 = {x:f(x1), y:x1};
	var p2 = {x:f(x2), y:x2};
	var c = {x:-(x2-x1)*.5*(2*a*x1+b)+p1.x, y:(x1+x2)*.5};
	points.push({rgb:rgb});
	var thick = .25;
	push3(p1,c,p2,thick);
	push3(p2,c,p1,-thick);
	function push3(u,v,w,t) {
		points.push([u.x+t, u.y, v.x+t, v.y]);
		points.push([w.x+t, w.y]);
	}
	gs.shape({p:points});
//	for(var i=x2;i<=x1;++i) {marker({x:f(i), y:i}, gfx.c.orange);}
}
function pulse() {
	gs.color({rgb: gfx.c.grey180});
	gs.clear();
	gs.color({rgb: gfx.c.black});
	gs.pen({r:.25});
	var xpos = lockXPos || mouse.x;
	vline(xpos);
	var list = [];
	pos.forEach(function(p) {if(p.x<xpos) list.push(p);});
	list.sort(function(a,b) {return a.x-b.x;});

	function prune(bin, lidx) {
		var p = list[lidx];
		var bout = [];
		var dx = xpos - p.x;
		var dx2 = .5 / dx;
		var dxSquared = dx*dx;
		bin.forEach(function(b, ndx) {
			if(b.low!=lidx && b.high!=lidx) { // can't obscure self
				var dy = b.y - p.y;
				var xt = xpos - (dxSquared+dy*dy)*dx2;
				if(xt > b.x) return;
			}
			bout.push(b);
		});
		return bout;
	}
	function fixLowHigh(b) {
		function slope(ndx) {
			var p = list[ndx];
			return (b.y-p.y) / (xpos - p.x);
		}
		if(slope(b.low) < slope(b.high)) {
			var t = b.low;
			b.low = b.high;
			b.high = t;
		}
	}
	var beach = [];// {x, y, low:idx, high:idx}
	if(bruteForce) { // brute force
		list.forEach(function(p1, id1) {
			list.forEach(function(p2, id2) {
				if(p1===p2) return;
					parabolaCross(p1, p2, xpos).forEach(function(b) {
						beach.push({x:b.x, y:b.y, low:id1, high:id2});
					});
			});
		});
		for(var lidx=0;lidx<list.length;++lidx)
			beach = prune(beach, lidx);
		beach.forEach(fixLowHigh);
	} else {
		list.forEach(function(p, lidx) {
			var flags = {};
			if(lidx<1) return;
			if(lidx==1) flags[0] = true;
//for(var i=0;i<lidx;++i) flags[i] = true;
			beach.forEach(function(b) {
				flags[b.low] = true;
				flags[b.high] = true;
			});
			Object.keys(flags).forEach(function(idx) {
				idx = parseInt(idx);
// We can do better than check for crossings against ALL points in the beach
				parabolaCross(p, list[idx], xpos).forEach(function(nb) {
					beach.push({x:nb.x, y:nb.y, low:lidx, high:idx});
				});
			});
			flags[lidx] = true;
			Object.keys(flags).forEach(function(idx) {
				beach = prune(beach, idx);
			});
			beach.forEach(fixLowHigh);
		});
	}
	var beachPoints = [];
	if(true) { // reporting
		var flags = {};
		beach.forEach(function(b) {
			flags[b.low] = flags[b.high] = true;
		});
//		mylog('Points:' + list.length, 'Beach:' + beach.length, 'PointsInBeach:' + Object.keys(flags).length);
		Object.keys(flags).forEach(function(k) {beachPoints.push(list[k]);});
	}

	beach.sort(function(a,b) {
		return a.y - b.y;
	});
	if(true) {
		var ly = -limit;
		beach.forEach(function(b, idx) {
			if(ly>=limit) return;
			drawParabola(list[b.low], xpos, ly, b.y, [0,0,0]);
			if(showGhost)
				drawParabola(list[b.high], xpos, ly, b.y, [255,0,0,64]);
			ly = b.y;
			if(idx+1 == beach.length && ly<limit)
				drawParabola(list[b.high], xpos, ly, limit, [0,0,0]);
		});
//mylog('-------------');mylog(beach);
	}

	list.forEach(function(p) {
//		drawParabola(p, xpos, -limit, limit, [0,0,0]);
	});
	if(false) { // trying to predict next event, when 2 beach points merge... not pretty
		function wide(s, n) {
			var spaces = '                    ';
			s+='';
			if(s.length<n) s+=spaces.slice(s.length-n);
			return s;
		}
		var old = false;
		beach.forEach(function(b) {
//mylog(wide(b.y, 20), wide(b.low, 6), wide(b.high, 6));
			if(old) {
				var n1=old.low, n2=old.high, n3=b.high;
				var cc = circumCenter(list[n1], list[n2], list[n3]);
				var r = dist(cc, list[n1]);
				if(r + cc.x > xpos)
					marker(cc, gfx.c.red);
			}
			old=b;
		});
	}
	show(beach, gfx.c.orange);
	show(pos, gfx.c.green);
	show(beachPoints, gfx.c.red);
	gs.update();
}

setInterval(pulse, 20);
