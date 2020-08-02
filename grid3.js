#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var mylog = console.log;
var gs = gfx.s;
var edge = 1024;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
});
var t = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	gs.color({rgb: [170, 0, 255]});
	for(var j=0;j<8;++j) {
		for(var i=0;i<8;++i) {
			var dadr = Math.sin(.2*(i+j+t*.4))*8.0;
			var r = dadr; // 8.0;
			gs.rect({x:25*(i-3.5), y:25*(j-3.5), dx:8.85, dy:8.85, r:r, a:45});
		}
	}
	var a = 6.28*t*.001;
	var r = 60;
	gs.color({rgb: [255, 255, 0]});
	var x = r*Math.cos(a);
	var y = -r*Math.sin(a);
	gs.disc({x:x, y:y, r:10});
	gs.disc({x:90, y:y, r:10});
	gs.disc({x:x, y:-90, r:10});
	gs.update();
	++t;
}
setInterval(pulse, 10);
