#!/usr/bin/env node
"use strict";

var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var mousex=0.0, mousey=0.0;
var down=false;
var size = 20;
var sizeMin = 5;
var sizeMax = 30;

gfx.on('key', function(code, mod, pressed) {
//	mylog('code=' + code, 'mod=' + mod, 'pressed=' + pressed);
	if(pressed) {
		if(code==27) gfx.quit();
		if(code==13) clear([255,255,255]);
		if(code==48) changeColor([0,0,0]);
		if(code==49) changeColor([255,0,0]);
		if(code==50) changeColor([0,255,0]);
		if(code==51) changeColor([0,0,255]);
		if(code==52) changeColor([255,255,0]);
		if(code==53) changeColor([255,0,255]);
		if(code==54) changeColor([0,255,255]);
		if(code==55) changeColor([255,255,255]);
		mylog(code);
	}
});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
gfx.on('button', function(button, pressed, x, y) {
	mylog('button=' + button, 'pressed=' + pressed, 'x=' + x, 'y=' + y);
	down=pressed;
});
gfx.on('wheel', function(v) {
	size += v;
	size = Math.min(size, sizeMax);
	size = Math.max(size, sizeMin);
});
function clear(rgb) {
	gs.color({rgb: rgb});
	gs.clear();
	gs.store({id:'bg'});
}

var edge = 1024;
gfx.setup({w:edge, h:edge});
var drawColor = [255, 0, 0];
function changeColor(color) {drawColor = color;}

clear([255,255,255]);
function pulse() {
	gs.color({rgb: [255, 0, 0]});
//	gs.clear();
	gs.restore({id: 'bg'});
	if(1) {
//		gs.pen({r:0.05});
		gs.color({rgb: drawColor});
		gs.box({x:mousex, y:mousey, dx:size, dy:size, r:8});
	}
	if(down) gs.store({id: 'bg'});
	gs.update();
}
setInterval(pulse, 20);
