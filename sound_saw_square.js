#!/usr/bin/env node
"use strict";
var mylog = console.log;
var gfx = require('gfx');
var gs = gfx.s;
var gc = gfx.c;
var ga = gfx.asc;
var gk = gfx.k;
var mouse = {x:0, y:0};
var edge = 1024;
var lVol = 1;
var rVol = 1;
var saw = true;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==gk.ESCAPE) gfx.quit();
	if(code==ga('l')) lVol = 1-lVol;
	if(code==ga('r')) rVol = 1-rVol;
	if(code==ga(' ')) saw=!saw;
});
gfx.on('motion', function(x, y) {mouse.x=x;mouse.y=y;});

gfx.audio(audioFeed);
var sounds = [{time:0},{time:0}];
var h = 0.0;
var markers = [];
function simple(o, f) {
	f = .001*Math.pow(1.02, f);
	o.time += f;
	var v = 2*(o.time - Math.floor(o.time) - .5);
	if(!saw) v = v<mouse.y*.01 ? -.5 : .5;
	return 0.7*v;
}
var trigger = false;
var old = 0;
function audioFeed(n) {
	var arr = [];
	while(n-- > 0) {
		var sum = 0.0;
		var v1 = simple(sounds[0], mouse.x+100);
		if(trigger) {
			if(old<0 && v1>=0) trigger=false;
			h = 0;
		}
		old = v1;
		if(!trigger) {
			markers.push({x:100*(h%2-1), y:v1*100});
			h+=.001;
			if(h>=2.0) trigger=true;
		}
		sum += v1;
		arr.push(sum*lVol, sum*rVol);
	}
	return arr;
}
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();
	function marker(x, y) {
		gs.color({rgb: gc.white});
		gs.disc({x, y, r:.5});
	}
	var mc = 0;
	markers.forEach(function(p) {
		if(mc++&7) return;
		marker(p.x,p.y);
	});
	markers = [];

	gs.update();
}
setInterval(pulse, 20);
