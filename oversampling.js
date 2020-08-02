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
var toggle = false;
var saw = true;
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==gk.ESCAPE) gfx.quit();
	if(code==ga('l')) lVol = 1-lVol;
	if(code==ga('r')) rVol = 1-rVol;
	if(code==ga(' ')) toggle=!toggle;
	if(code==gk.RETURN) freq=initialFreq;
	if(code==ga('s')) saw=!saw;
});
gfx.on('motion', function(x, y) {mouse.x=x;mouse.y=y;});

var a0,a1,a2,b0,b1,b2;
var w1=0,w2=0;
var over = 16;
var lowRate=48000;
var highRate=lowRate*over;

// Direct form 2
// https://en.wikipedia.org/wiki/Digital_biquad_filter
function step(input) {
	var w0 = input - a1*w1 - a2*w2;
	var output = b0*w0 + b1*w1 + b2*w2;
	w2=w1;w1=w0;
	return output;
}

function filter(f) {
	var w0 = 2.0*Math.PI*f/highRate;
	var c = Math.cos(w0);
	var s = Math.sin(w0);
	var tunable = .01;
	var qR = 10.0;
	var Q = 1.0/qR + (qR - 1.0/qR) * tunable;
	var alpha = s/(2.0*Q);
	w1=w2=0;
	b0 = (1.0 - c)/2.0;
	b1 = (1.0 - c);
	b2 = b0;
	a0 =	(1.0 + alpha);
	a1 = -2*c;
	a2 =	(1.0 - alpha);
	b0/=a0;
	b1/=a0;
	b2/=a0;
	a1/=a0;
	a2/=a0;
//	mylog(a0,a1,a2);
//	mylog(b0,b1,b2);

}
filter(16000);

gfx.audio(audioFeed);
var sounds = [{time:0},{time:0}];
var h = 0.0;
var markers = [];
function simple(o, df) {
	o.time += df;
	var v = 2*(o.time - Math.floor(o.time) - .5);
	if(!saw) v = v<mouse.y*.01 ? -.5 : .5;
	return 0.7*v;
}
var trigger = false;
var old = 0;
var initialFreq = 1/(32*over);
var freq = initialFreq;
function audioFeed(n) {
	var arr = [];
	
	var df = freq;
	freq *=.999;

	while(n-- > 0) {
		var out;
		var input, output;
		for(var i=0;i<over;++i) {
			input = simple(sounds[0], df);
			output = step(input);
		}
		if(toggle)output=input;

		if(trigger) {
			if(old<0 && output>=0) trigger=false;
			h = 0;
		}
		old = output;
		if(!trigger) {
			markers.push({x:100*(h%2-1), y:output*100});
			h+=.001;
			if(h>=2.0) trigger=true;
		}
		arr.push(output*lVol, output*rVol);
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
