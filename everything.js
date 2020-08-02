#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
var mouse = {x:0, y:0};
var radius = 15;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
	if(code==gfx.asc(' ') && pressed) listPrimitives();
	if(pressed) mylog('code', code, '0x'+code.toString(16));
});
gfx.on('wheel', function(v) {
//	mylog('wheel', v);
	radius += v;
});
gfx.on('button', function(button, pressed, x, y) {
//	mylog('button', button, pressed, x, y);
});
gfx.on('motion', function(x, y) {
//	mylog('motion', x, y);
	mouse.x = x;
	mouse.y = y;
});

function listPrimitives() {
	function list(desc, x) {
		mylog('--- ' + desc + ' in gfx.' + x + ' ---');
		Object.keys(gfx[x]).sort().forEach(function(k) {
			mylog(k);
		});
	}
	list('Primitives', 's');
	list('Colors', 'c');
	list('Keys', 'k');
}

var t = 0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	var x, y;
	var count = 0;
	function next() {
		x = (count&3) * 50 - 75;
		y = (count>>2) * 50 - 75;
		++count;
	}
	var tilt = Math.cos(t*.1);
	var tilt2 = Math.sin(t*.1);

	next();
	gs.color({rgb: gfx.c.chocolate});
	gs.box({x:x, y:y, dx: 8, dy:10, a:5*tilt});

	next();
	gs.color({rgb: gfx.c.blue});
	gs.pen({r:.7+tilt*.5});
	gs.circle({x:x, y:y, r:12});

	next();
	gs.color({rgb: gfx.c.green});
	gs.disc({x:x, y:y, r:15});

	next();
	gs.color({rgb: gfx.c.cyan});
	gs.pen({r:.5});
	gs.ellipse({x:x, y:y, dx:10, dy:8, a:10*tilt});

	next();
	gs.color({rgb: gfx.c.grey180});
	gs.opoly({x:x, y:y, r:15, s:8, a:-5*tilt});

	next();
	gs.color({rgb: gfx.c.grey200});
	gs.oval({x:x, y:y, dx:13, dy:15, a:-15*tilt2});

	next();
	gs.color({rgb: [255, 255, 255]});
	gs.poly({x:x, y:y, r:6, a:t});

	next();
	gs.color({rgb: gfx.c.magenta});
	gs.rect({x:x, y:y, dx:13, dy:15, r:0, a:-15*tilt2});

	gs.color({rgb: gfx.c.orange});
	gs.vector({x:-75, y:50+tilt*40, x2:75, y2:50+tilt2*40});

	gs.color({rgb: [255,0,0,160],});
	gs.disc({x:mouse.x, y:mouse.y, r:radius});

	gs.update();
	++t;
}
setInterval(pulse, 20);
