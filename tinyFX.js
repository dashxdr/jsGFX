#!/usr/bin/env node
"use strict";

var mylog = console.log;
var gfx = require('gfx');
var edge = 512;
var screen = {x:100, y:100};
gfx.setup({w:edge, h:edge});
var gs = gfx.s;
var ga = gfx.asc;
var gk = gfx.k;

var bullWhip = gfx.loadmp3('sfx/BullWhipCrack.mp3');
var boing = gfx.loadmp3('sfx/Boing.mp3');
//var gate = gfx.

gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==gk.ESCAPE) gfx.quit();
	if(code==ga(' ')) play(bullWhip);
	if(code==ga('1')) play(boing);
	if(code==ga('q')) quiet();
});

function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();
	gs.update();
}

setInterval(pulse, 20);





var playing = [];
bullWhip.on('ready', play, bullWhip);    // This just triggers a sound on startup, as an example
gfx.audio(audioFeed);

function play(s) {
	if(!s) return;
	playing.push({s, count:0, total:s.sampleCount*s.channelCount});
}
function quiet() {playing=[];}

function audioFeed(n) {
	var arr = new Array(n*2).fill(0);
	var vol = 1.;
	
	var old = playing;
	playing = [];
	old.forEach(function(o) {
		var n2 = n*2;
		for(var i=0;i<n2 && o.count<o.total;++i)
			arr[i] += o.s.samples[o.count++]
		if(o.count<o.total) // more samples to play?
			playing.push(o); // add to active playing list
	});
	return arr;
}
