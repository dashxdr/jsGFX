#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var gc = gfx.c;
var mylog = console.log;
var edge = 1200;
var mouse = {x:0,y:0};
gfx.setup({w:edge, h:edge});
var toggle = true;
var clearing = true;
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code==gfx.asc('c')) clearing = !clearing;
	if(code==gfx.asc(' ')) {
		toggle = !toggle;
		if(toggle) mylog('Showing dx,dy,dz');
		else mylog('Showing dx,dz,dy');
	}
});
gfx.on('motion', function(x, y) {mouse.x = x;mouse.y=y;});
var t = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	gs.color({rgb: [255, 255, 255]});
	var u,v;
	var step = 10;
	var lx=100+step*.5, ly=100+step*.5;
	var scale = .0005;
	gs.pen({r:.25});
	var zoom=2;
	var x,y,z;
	var m = zoom*mouse.x;
	for(v=-ly;v<=ly;v+=step) {
		for(u=-lx;u<=lx;u+=step) {
			if(toggle) {
				x=u*zoom;
				y=v*zoom;
				z=m;
			} else {
				x=u*zoom;
				y=m;
				z=v*zoom;
			}
			z+=25;
			var dx = 10*(y-x);
			var dy = 28*x - y - x*z;
			var dz = x*y - 8*z/3;
			var px, py, pz;
			if(toggle) {
				px = dx;
				py = dy;
				pz = dz;
			} else {
				px = dx;
				py = dz;
				pz = dy;
			}
			arrow(0, pz, gc.red);
			arrow(px, py, gc.white);

			function arrow(px, py, color) {
				gs.color({rgb:color});
				var r = Math.sqrt(px*px+py*py);
				var r1=1/r;
				var bx = r1*px;
				var by = r1*py;
				var ax = -by;
				var ay = bx;
				r=Math.log(r);
				if(r<0) r=0;
				var p = [];
				function add(a, b) {
					var tx = u + a*ax + b*bx;
					var ty = v + a*ay + b*by;
					p.push([tx, ty]);
				}
				var s1 = .3; // sideways line body
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
			}

		}
	}

	gs.update();
	++t;
}
setInterval(pulse, 20);
