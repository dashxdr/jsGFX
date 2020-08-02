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
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==gk.ESCAPE) gfx.quit();
	if(code==ga('l')) lVol = 1-lVol;
	if(code==ga('r')) rVol = 1-rVol;
});
gfx.on('motion', function(x, y) {mouse.x=x;mouse.y=y;});

gfx.audio(audioFeed);
var sounds = [{time:0},{time:0}];
var markers = [];
function simple(o, f) {
	f*=.001;
	return 0.7*Math.sin(o.time += f);
}

function audioFeed(n) {
	var arr = [];
	while(n-- > 0) {
		var sum = 0.0;
		var v1 = simple(sounds[0], mouse.x);
		var v2 = simple(sounds[1], mouse.y);
		markers.push({x:v1*100, y:v2*100});
		sum += v1;
		sum += v2;
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
