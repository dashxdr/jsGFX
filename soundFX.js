#!/usr/bin/env node
"use strict";

var mylog = console.log;
var gfx = require('gfx');
var edge = 512;
var screen = {x:100, y:100};
gfx.setup({w:edge, h:edge});
var gs = gfx.s;
var gc = gfx.c;
var ga = gfx.asc;
var gk = gfx.k;
var trigger=0;
var dir = 1;
var mouse = {x:0, y:0};
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==gk.ESCAPE) gfx.quit();
	if(code==ga(' ')) seek(0, 1);
	if(code==gk.RIGHT) load(1);
	if(code==gk.LEFT) load(-1);
});
gfx.on('motion', function(x, y) {
	mouse = {x:x, y:y};
});
gfx.on('button', function(button, pressed, x, y) {
	if(!pressed) return;
	if(button==1) // left button
		trigger=1;
	if(button==3) // right button
		trigger=-1;
});
gfx.on('resize', function(vw, vh, w, h) {
	screen.x=vw;
	screen.y=vh;
});

var ranges = [];
var names = process.argv.slice(2);
var loaded = {};
var sampleCount;
var totalSamples;

if(names.length==0) names.push('sfx/BullWhipCrack.mp3');
var s;
function load(d) {
	if(d) {
		if(d>0) names.push(names.shift());
		else names.unshift(names.pop());
	}
	var name = names[0];
	var ns = loaded[name];
	if(!ns) {
		ns = gfx.loadmp3(name);
		if(!ns) mylog('Problem loading', name);
		else s = loaded[name] = ns;
	} else s=ns;
	if(s) {
		mylog(name);
		s.on('ready', function() {setupRanges(512)});
	}
}
load();
var echo = [];
for(var i=0;i<9000;++i) echo.push(0); // change loop count to control echo

if(!s) process.exit(); // need at least 1

function setupRanges(bins) {
	ranges = [];
	var t = s.sampleCount * s.channelCount;
	function pos(n) {
		n=Math.floor(n*t/bins);
		return n-n%s.channelCount;
	}
	for(var i=0;i<bins;++i) {
		var min = 1000;
		var max = -1000;
		var low = pos(i);
		var high = pos(i+1);
		while(low<high) {
			var v = s.samples[low++];
			if(v<min) min=v;
			if(v>max) max=v;
		}
		ranges.push([min,max]);		
	}
	totalSamples = s.sampleCount * s.channelCount;
	seek(0, 1);
}

gfx.audio(audioFeed);
function seek(f, d) { // f is in range 0 to 1
	sampleCount = Math.floor(f*s.sampleCount)*s.channelCount;
	dir = d;
}

function audioFeed(n) {
	var arr = [];
	var vol = .9;
	var vol2 = .6; // change vol2 to control echo decay
	function append(l,r) {
		l += echo.shift()*vol2;
		r += echo.shift()*vol2;
		echo.push(l,r);
		arr.push(l,r);
	}
	if(dir>0) {
		while(n-- > 0) {
			if(sampleCount<totalSamples) {
				append(s.samples[sampleCount]*vol, s.samples[sampleCount+1]*vol);
				sampleCount+=2;
			} else
				append(0,0);
		}
	} else {
		var end = 0;
		while(n-- > 0) {
			if(sampleCount>0) {
				append(s.samples[sampleCount]*vol, s.samples[sampleCount+1]*vol);
				sampleCount-=2;
			} else
				append(0,0);
		}
	}
	return arr;
}

var markers = [];
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

	var len = ranges.length;
	function getX(v) {return screen.x*(-1 + 2*v/len);}
	function getY(v) {return screen.y*v;}
	gs.color({rgb: gc.white});
	var e = .25;
	var points = [];
	for(var j=0;j<2;++j) {
		function invert(x) {return !j ? x : len-1-x;}
		for(var i=0;i<len;++i) {
			var ti = invert(i);
			var h = ranges[ti];
			var ty = !j ? getY(h[0])-e : getY(h[1])+e;
			points.push([getX(ti), ty]);
			points.push([getX(invert(i+1)), ty]);
		}
	}
	gs.shape({p:points});
	function trace(x, color) { // x in range 0 to 1
		gs.color({rgb: color});
		x=(2*x-1)*screen.x;
		gs.pen({r:100/len});
		gs.vector({x:x, y:100, x2:x, y2:-100});
	}
	var mousex = .5*(mouse.x/screen.x+1); // 0 to 1 range now

	trace(mousex, gc.yellow);
	trace(sampleCount/totalSamples, gc.red);
	if(trigger) {
		seek(mousex, trigger);
		trigger = 0;
	}

	gs.update();
}
setInterval(pulse, 20);
