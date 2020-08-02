#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
var mouse = {x:0,y:0};
var points = [];

function reRandom() {
	points = [];
	function r() {return (Math.random()-.5)*180;}
	for(var i=0;i<100;++i) {
		var mind2 = 10*10;
		for(;;) {
			var o = {x:r(), y:r()};
			var dx, dy;
			var good = true;
			points.forEach(function(e) {
				dx = e.x - o.x;
				dy = e.y - o.y;
				if(dx*dx + dy*dy<mind2)
					good=false;
			});
			if(good) break;
		}
		points.push(o);
	}
}
reRandom();

gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code==gfx.asc(' ')) reRandom();
});
gfx.on('motion', function(x, y) {mouse.x = x;mouse.y=y;});
var t = 0.0;



function pulse() {
	gs.color({rgb: [0, 0, 192]});
	gs.clear();

	gs.color({rgb: [255, 255, 255]});
	points.forEach(function(e) {
		var bx = mouse.x - e.x;
		var by = mouse.y - e.y;
		var f = 1/Math.sqrt(bx*bx + by*by);
		bx*=f;
		by*=f;
		var ax = -by;
		var ay = bx;
		var r = 8;
		var p = [];
		var x = e.x - bx*r*.5;
		var y = e.y - by*r*.5;
		function add(a, b) {
			var tx = x + a*ax + b*bx;
			var ty = y + a*ay + b*by;
			p.push([tx, ty]);
		}
		var s1 = r*.08; // sideways line body
		var s2 = s1*5; // sideways arrow tips
		var s3 = s1*8; // sideways arrow tips back from point
		var s4 = s1*5; // insides of arrow sides back from point
		add(0, r);
		add(s2, r-s3);
		add(s1, r-s4);
		add(s1, 0);
			add(-s1, 0);
		add(-s1, r-s4);
		add(-s2, r-s3);
		gs.shape({p});
	});

	gs.update();
	++t;
}
setInterval(pulse, 20);
