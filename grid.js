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

	gs.color({rgb: [255, 0, 255]});
	for(var j=0;j<8;++j) {
		for(var i=0;i<8;++i) {
			var dadr = Math.sin(.2*(i+j+t*.4))*8.0;
			var r = dadr; // 8.0;
			gs.disc({x:25*(i-3.5), y:25*(j-3.5), r:r});
		}
	}
	gs.update();
	++t;
}
setInterval(pulse, 50);
