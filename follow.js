#!/usr/bin/env node
"use strict";

var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var mousex=0.0, mousey=0.0;
var speed=1;
var size=8;

gfx.on('key', function(code, mod, pressed) {
//	mylog('code=' + code, 'mod=' + mod, 'pressed=' + pressed);
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code>=48 && code<=57) speed=code-48;
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
var colors = [];
var spacing = 16;
var num = 20;
for(var i=0;i<num*spacing;++i) {
	pos[i] = {
		x:0, y:0,
	};
}
function newColor() {
	return [rand(256), rand(256), rand(256)];
}
newColors();
function newColors() {
	for(var i=0;i<num;++i) colors[i]=newColor();
}
function newBG() {bg = newColor();}

function rand(x) {
	return Math.floor(Math.random()*x);
}
function pulse() {
	gs.color({rgb: bg});
	gs.clear();
	gs.color({rgb: [255, 255, 255]});
	pos.shift();
	pos.push({x:mousex, y:mousey});

	gs.pen({r:.25});

	for(var i=0;i<num;++i) {
		var o = pos[i*spacing+spacing-1];
		gs.color({rgb: colors[i]});
		gs.disc({x:o.x, y:o.y, r:size});
		gs.color({rgb: [0, 0, 0]});
		gs.circle({x:o.x, y:o.y, r:size});
	}

	gs.update();
}
setInterval(pulse, 20);
