#!/usr/bin/env node
"use strict";

var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var mousex=0.0, mousey=0.0;
var speed=1;

gfx.on('key', function(code, mod, pressed) {
//	mylog('code=' + code, 'mod=' + mod, 'pressed=' + pressed);
	if(code==27 && pressed) gfx.quit();
	if(code>=48 && code<=57) speed=code-48;
});
gfx.on('motion', function(x, y) {mousex = x;mousey = y;});
gfx.on('button', function(button, pressed, x, y) {
	mylog('button=' + button, 'pressed=' + pressed, 'x=' + x, 'y=' + y);
});
var edge = 800;
gfx.setup({w:edge, h:edge});

var c = 0;
function pulse() {
//	gs.test({});
	c+=.01*speed;
	gs.color({rgb: [0, 0, 0]});
	gs.clear();
	if(1) {
		gs.color({rgb: [255, 255, 255]});
		gs.pen({r:.3});
		var deep = 1000;
		var num = 40;
		var zz = 1.0-c%1;
		var x0=0.0, y0=0.0, z0=0.0;
		var small = .1;
		var x1=mousex*small, y1=mousey*small, z1=z0+deep; 
		var p=5;
		for(var i=0;i<num;++i) {
			var f1 = (i+zz)/num;
			var f0 = 1.0-f1;
			var x = x0*f0+x1*f1;
			var y = y0*f0+y1*f1;
			var z = z0*f0+z1*f1;
			var r = 200*p/(z+p);
			gs.pen({r:r*.05});
			gs.circle({x:x, y:y, r:r});
		}
	}

	gs.update();
}
setInterval(pulse, 16.6666);
