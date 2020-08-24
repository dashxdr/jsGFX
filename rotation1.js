#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
var mouse = {x:0,y:0};
var down=false;
var mat = [1,0,0,0,1,0];

gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
});
gfx.on('motion', function(x, y) {
	mouse = {x,y};
	if(down) {
		mat[2] = x + down.dx;
		mat[5] = y + down.dy;
	}
});
function apply(p) {
	return {x:p.x*mat[0] + p.y*mat[1] + mat[2],
		y:p.x*mat[3] + p.y*mat[4] + mat[5]};
}
function invert(p) {
	var x = p.x-mat[2];
	var y = p.y-mat[5];
	var a = mat[0];
	var b = mat[1];
	var c = mat[3];
	var d = mat[4];
	var det = 1/(a*d-b*c);
	return {x:det*(x*d - y*b), y:det*(-x*c + y*a)};
}
function spin(p, v) {
	var at = invert(p);
	var s = Math.sin(v);
	var c = Math.cos(v);
	function r(a,b) {
		var x = mat[a]*c + mat[b]*s;
		var y = -mat[a]*s + mat[b]*c;
		mat[a] = x;
		mat[b] = y;
	}
	r(0,1);
	r(3,4);
	at = apply(at);
	mat[2] += p.x - at.x;
	mat[5] += p.y - at.y;
}

gfx.on('wheel', function(v) {
	spin(mouse, v*.1);
});
gfx.on('button', function(button, pressed, x, y) {
//	mylog(button, pressed, x, y);
	if(button==1) {
		if(pressed) down = {dx:mat[2]-x, dy:mat[5]-y};
		else down=false;
	}
});

function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();
spin(mouse, .04);

	gs.transform({m:mat});
	gs.color({rgb: gfx.c.peru});
	gs.oval({x:0, y:0, dx:43, dy:50});
	var ex=20, ey = 20, er=10, er2=4, er3=1.5;
	gs.color({rgb: gfx.c.white});
	gs.disc({x:ex, y:ey, r:er});
	gs.disc({x:-ex, y:ey, r:er});
	gs.color({rgb: gfx.c.lightblue});
	gs.disc({x:ex, y:ey, r:er2});
	gs.disc({x:-ex, y:ey, r:er2});

	gs.color({rgb: gfx.c.black});
	gs.disc({x:0, y:-20, r:15+5});
	gs.disc({x:ex, y:ey, r:er3});
	gs.disc({x:-ex, y:ey, r:er3});

	var p = invert(mouse);

	gs.color({rgb:[255,255,255,192]});
	gs.pen({r:.4});
	var size = 10;
	gs.vector({x:p.x-size, y:p.y, x2:p.x+size, y2:p.y});
	gs.vector({x:p.x, y:p.y-size, x2:p.x, y2:p.y+size});

	gs.update();
}
setInterval(pulse, 20);
