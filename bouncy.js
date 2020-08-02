#!/usr/bin/env node
"use strict";

var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1024;
gfx.setup({w:edge, h:edge});

var c = 0;
var posX=20,posY=0;
var speed=.5;
var stepX=.3*speed,stepY=.5*speed;
var skip = 300;
posX += stepX*skip;
posY += stepY*skip;
var limit=100;
var size = 10;
var hitX=0,hitY=0;
var hitTime=4;
var k = .002;
var accel = 1; // acceleration factor

gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	mylog('code=' + code, 'mod=' + mod);
	if(code>=48 && code<=57) accel = code-48;
	if(code==27) gfx.quit();
});

function step(o) {
	posX+=stepX;
	posY+=stepY;
	if(posY>limit-size) {
		o.dy = limit-posY;
		stepY-=k*(size-o.dy);
	}
	if(posY<-limit+size) {
		o.dy = limit+posY;
		stepY+=k*(size-o.dy);
	}
	if(posX>limit-size) {
		o.dx = limit-posX;
		stepX-=k*(size-o.dx);
	}
	if(posX<-limit+size) {
		o.dx = limit+posX;
		stepX+=k*(size-o.dx);
	}
}
function pulse() {
	++c;
	gs.color({rgb: [0, 128, 255]});
	gs.clear();
	var o = {dx:size, dy:size};
	for(var i=0;i<accel;++i) {
		step(o);
	}
	var dx=o.dx, dy=o.dy;

	if(dx<size || dy<size)
		gs.color({rgb: [255, 255, 255]});
	else
		gs.color({rgb: [255, 255, 0]});
	gs.oval({x:posX, y:posY, dx:dx, dy:dy, r:0, a:0});
	gs.update();
}
setInterval(pulse, 20);
