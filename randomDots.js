#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
});
var xc = 0, yc = 0;
function fraction(t) {
	var f = .5;
	var o = 0;
	while(t) {
		if(t&1) o+=f;
		t>>=1;
		f*=.5;
	}
	return o;
}

function pulse() {
//	gs.color({rgb: [0, 0, 0]});
//	gs.clear();

	gs.color({rgb: [255, 255, 255]});
	function pos(n) {return fraction(n)*200-100;}
	for(var i=0;i<500;++i) {
		
		gs.disc({x:pos(xc), y:pos(yc), r:.2});
		if(xc==yc) {++yc;xc=0;}
		else ++xc;
	}

	gs.update();
}
setInterval(pulse, 50);
