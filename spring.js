#!/usr/bin/env node
"use strict";

var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var mousex=0.0, mousey=0.0;
var speed=1;
var size=3;
var halt=false;

gfx.on('key', function(code, mod, pressed) {
//	mylog('code=' + code, 'mod=' + mod, 'pressed=' + pressed);
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code>=48 && code<=57) speed=code-48;
	if(code==32) halt=true;
	if(code==99) newColors();
	if(code==98) newBG();
});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
gfx.on('button', function(button, pressed, x, y) {
	mylog('button=' + button, 'pressed=' + pressed, 'x=' + x, 'y=' + y);
});
var edge = 1200;
var bg = [255, 255, 0];
gfx.setup({w:edge, h:edge});
var pos = [];
for(var i=0;i<10;++i) {
	pos[i] = {
		x:0, y:0,
		dx:0, dy:0,
	};
}
function newColor() {
	return [rand(256), rand(256), rand(256)];
}
newColors();
function newColors() {
	pos.forEach(function(o) {
		o.color = newColor();
	});
}
function newBG() {bg = newColor();}

function rand(x) {
	return Math.floor(Math.random()*x);
}
function pulse() {
	gs.color({rgb: bg});
	gs.clear();
	gs.color({rgb: [255, 255, 255]});
	var m = pos[pos.length-1];
	m.color = [255, 255, 255];
	m.x = mousex;
	m.y = mousey;
	var last = false;
	pos.forEach(function(o) {
		if(last) {
			var dx = last.x - o.x;
			var dy = last.y - o.y;
			var d = Math.sqrt(dx*dx + dy*dy);
			var f = 0.0*size*2.0 - d;
			d = d && f*.05/d;
			dx*=d;
			dy*=d;
			last.dx += dx;
			last.dy += dy;
			o.dx -= dx;
			o.dy -= dy;
		}
		last = o;
	});
	m.dx = m.dy = 0;
	var friction=.994;
	pos.forEach(function(o) {
		o.x += o.dx;
		o.y += o.dy;
		o.dx*=friction;
		o.dy-=.025;
		o.dy*=friction;
		if(halt) o.dx = o.dy = 0.0;
	});
	halt=false;

	gs.pen({r:.25});

	pos.forEach(function(o) {
		var r = 5;
		gs.color({rgb: o.color});
		gs.disc({x:o.x, y:o.y, r:size});
		gs.color({rgb: [0, 0, 0]});
		gs.circle({x:o.x, y:o.y, r:size});
	});

	gs.update();
}
setInterval(pulse, 20);
