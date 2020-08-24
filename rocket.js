#!/usr/bin/env node
"use strict";

var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var mousex=0.0, mousey=0.0;
var gravity=9.0;
var thrust=1.0;
var size=8;
var goLeft = false;
var goRight = false;
var goUp = false;
var goDown = false;
var erasing = 1;
var star = 1;
var limit=100;
var limit2=limit*2;
var lc=0, rc=0, uc=0, dc=0;
var asc = gfx.asc;
gfx.on('key', function(code, mod, pressed) {
//	mylog('code=' + code, 'mod=' + mod, 'pressed=' + pressed);
	if(code==gfx.k.LEFT) {goLeft=pressed;lc=0;}
	if(code==gfx.k.RIGHT) {goRight=pressed;rc=0;}
	if(code==gfx.k.UP) {goUp=pressed;uc=0;}
	if(code==gfx.k.DOWN) {goDown=pressed;dc=0}
	if(!pressed) return;
	if(code==gfx.k.ESC) gfx.quit(); // escape key
	if(code==gfx.k.ENTER) center(); // enter key
	if(code>=asc('0') && code<=asc('9')) gravity=code-asc('0');
	if(code==asc('b')) newBG();
	if(code==asc('s')) star^=1;
	if(code==asc('e')) erasing^=1;
	if(code==asc(' ')) ship.dx = ship.dy = 0.0;
});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
gfx.on('button', function(button, pressed, x, y) {
	mylog('button=' + button, 'pressed=' + pressed, 'x=' + x, 'y=' + y);
});
var edge = 1200;
var bg = [0, 0, 0];
gfx.setup({w:edge, h:edge});
var ship = {};
var colors = [];
center();
function center() {
	ship.x = 50.0;
	ship.y = -50.0;
	ship.dx = 0.0;
	ship.dy = star ? 0.2 : 0.0;
	ship.a = 90.0;
	ship.da = 0.0;
}
function newColor() {
	return [rand(256), rand(256), rand(256)];
}
function newBG() {bg = newColor();}

function rand(x) {
	return Math.floor(Math.random()*x);
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
function dist(a,b) {var dx = a.x-b.x, dy = a.y-b.y;return Math.sqrt(dx*dx + dy*dy);}
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

var c=0;
function pulse() {
	++c;
	if(erasing) {
		gs.color({rgb: bg});
		gs.clear();
	}

	ship.x+=ship.dx;
	ship.y+=ship.dy;
	ship.a+=ship.da;
	if(star) { // star + gravity
		var d2 = ship.x*ship.x + ship.y*ship.y;
		if(d2>0.0) {
			var d = gravity /(d2 * Math.sqrt(d2));
			ship.dx-=ship.x*d;
			ship.dy-=ship.y*d;
		}
		gs.pen({r:.25});
		gs.color({rgb: [255, 160, 0]});
		gs.poly({x:0, y:0, s:16, r:1.5, r2:2.0+.25*Math.cos(c*.01)});
	}
	gs.pen({r:.25});
	function pos(a, r) {
		a+=ship.a;
		r*=4.0;
		a*=3.1415928/180.0;
		return {x:ship.x+r*Math.cos(a),y:ship.y+r*Math.sin(a)};
	}
	function drawFullShip2(dx, dy) {
		function tp(x,y) {return {x:x,y:y};}
		var sp = [tp(56, 0), tp(-40,32), tp(-24, 16), tp(-24,-16), tp(-40,-32)];
		var radians = ship.a*3.1415928/180.0;
		var s = Math.sin(radians);
		var c = Math.cos(radians);
		dx += ship.x;
		dy += ship.y;
		size=.08;
		function rp(p) {
			var xp = p.x*c - p.y*s;
			var yp = p.x*s + p.y*c;
			return [dx+size*xp, dy+size*yp];
		}
		function draw(iv, rgb) {
			var points = [];
			points.push({rgb:rgb});
			indent(sp, iv).forEach(function(o) {
				points.push(rp(o));
			});
			gs.shape({p:points});
		}
		draw(0, [255,255,255]);
		draw(3, [0,0,0]);
	}
	function drawFullShip1(x, y) {
		function drawShip(size, side, rgb, x, y) {
			gs.color({rgb: rgb});
			var points = [];
			function posA(a, r) {
				var t=pos(a, r);
				return [x+t.x, y+t.y];
			}
			points.push(posA(0, size));
			points.push(posA(180-side, size));
			points.push(posA(180+side, size));
			gs.shape({p:points});
			gs.color({rgb: [0, 0, 0]});
		}

		var s=1.0;
		var side = 30;
		drawShip(s, side, [255,255,255], x, y);

		s*=.8755;
		side = 26;
		drawShip(s, side, [0,0,0], x, y);
	}
	var drawFullShip = drawFullShip2;
	var xdelta = ship.x<0 ? limit2 : -limit2;
	var ydelta = ship.y<0 ? limit2 : -limit2;
	drawFullShip(0     ,0);
	drawFullShip(xdelta,0);
	drawFullShip(xdelta,ydelta);
	drawFullShip(0     ,ydelta);

	function v(a,b) {
		gs.vector({x:a.x, y:a.y, x2:b.x, y2:b.y});
	}
	var da = .25;
	if(goLeft) {
		ship.da+=da;
		if(~lc++&2) {
			var j4=pos(-28, 0.4);
			var j5=pos(-50, 1.0);
			gs.pen({r:1.0});
			gs.color({rgb: [255, 160, 0]});
			v(j4, j5);
		}
	}
	if(goRight) {
		ship.da-=da;
		if(~rc++&2) {
			var j4=pos(28, 0.4);
			var j5=pos(50, 1.0);
			gs.pen({r:1.0});
			gs.color({rgb: [255, 160, 0]});
			v(j4, j5);
		}
	}
	if(goUp) {
		var a = ship.a*3.1415928/180.0;
		var f = .05*thrust;
		ship.dx += f*Math.cos(a);
		ship.dy += f*Math.sin(a);
		if(~uc++&2) {
			var p4=pos(180, .8);
			var p5=pos(180, 1.8);
			gs.pen({r:1.0});
			gs.color({rgb: [255, 160, 0]});
			v(p4, p5);
		}
	}
	if(goDown) {
		var a = ship.a*3.1415928/180.0;
		var f = .05*thrust;
		ship.dx += -f*Math.cos(a);
		ship.dy += -f*Math.sin(a);
		if(~uc++&2) {
			var p4=pos(0, 1.0);
			var p5=pos(180, -1.8);
			gs.pen({r:1.0});
			gs.color({rgb: [255, 160, 0]});
			v(p4, p5);
		}
	}
//	mylog(ship.y);
	if(ship.y>limit) ship.y -= limit2;
	if(ship.y<-limit) ship.y += limit2;
	if(ship.x>limit) ship.x -= limit2;
	if(ship.x<-limit) ship.x += limit2;
	gs.update();
}
setInterval(pulse, 20);
