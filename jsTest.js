#!/usr/bin/env node
"use strict";

var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var mousex=0.0, mousey=0.0;

gfx.on('key', function(code, mod, pressed) {
//	mylog('code=' + code, 'mod=' + mod, 'pressed=' + pressed);
	if(code==27 && pressed) gfx.quit();
});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
gfx.on('button', function(button, pressed, x, y) {
	mylog('button=' + button, 'pressed=' + pressed, 'x=' + x, 'y=' + y);
});
var connected = false;
gfx.on('connect', function() {
	if(!connected) {
		drawBG();
		setInterval(pulse, 20);
		connected = true;
	}
});
gfx.on('resize', function() {
	drawBG();
});
var edge = 1024;
gfx.setup({w:edge, h:edge});

var count = 0;
function pulse() {
//	gs.test({});
	if(0) {
		gs.color({rgb: [0, 128, count]});
		gs.clear();
	} else
		gs.restore({id: 'bg'});
	if(0) {
		gs.color({rgb: [255, 120, 0]});
		gs.rendertest({});
	}
	if(1) {
		var a = count*.01;
		var c = Math.cos(a);
		var s = Math.sin(a);
// work in progress 20181028, turned back off...
//		gs.transform({m:[c,-s,0.0, s, c, 0.0]});
		gs.pen({r:4});
		gs.color({rgb: [0,0,0]});
		var t = count%500;
		var f = 100.0 / (t+100);
		for(var x=-100;x<=100;x+=10)
			gs.vector({x: x*f, y: -95, x2: x/f, y2:95});
//		gs.transform({});
	}
	if(1) {
		gs.color({rgb: [255, 0, 0]});
		gs.disc({x:50, y:50, r:50});
	}
	if(1) {
		gs.pen({r:1});
		gs.color({rgb: [0, 255, 0]});
		gs.circle({x:-50, y:50, r:40});
	}
	if(1) {
		gs.pen({r:3});
		gs.color({rgb: [0, 0, 255]});
		var r = (Math.sin(c*.1)+1.0)*7.5;
		gs.rect({x:-50, y:-50, dx:30, dy:15, r:r, a:count});
	}
	if(1) {
		gs.color({rgb: [255, 255, 0]});
		gs.box({x:50, y:-50, dx:30, dy:15, r:8, a:30});
	}
	if(1) {
		gs.color({rgb: [255, 255, 255]});
		var func = (count&64) ? gs.ellipse : gs.oval;
		gs.pen({r:.5});
		func({x:mousex, y:mousey, dx:7, dy:5, a:count*4});
	}

	gs.update();
	++count;
}

function drawBG() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();
	gs.pen({r:4});
	var i;
	var n = 100;
	var low = -100;
	var high = 100;
	for(i=0;i<100;++i) {
		gs.color({rgb: [255*i/n,0,0]});
		var f1 = i / n;
		var f2 = 1.0 - f1;
		var y = f1*low + f2*high
		gs.vector({x: -100, y: y, x2: 100, y2:y});
	}
	gs.store({id: 'bg'});
}

//setInterval(pulse, 20);
