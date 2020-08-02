#!/usr/bin/env node
//"use strict";
// https://journals.sagepub.com/doi/full/10.1177/2041669518815708
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 600;
var mouse = {x:0,y:0};
var dir = 0;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
	if(!pressed) return;
	if(code==gfx.k.UP) dir=0;
	if(code==gfx.k.DOWN) dir=1;
	if(code==gfx.k.LEFT) dir=2;
	if(code==gfx.k.RIGHT) dir=3;
});
gfx.on('motion', function(x, y) {mouse.x = x;mouse.y=y;});
function pulse() {
	var t = (+new Date())*.001;
	t*=2; // 2HZ
	t -= Math.floor(t);

	var a = t*Math.PI*2;
	function iFix(v) {return 255*(Math.sin(v)*.3 + .5);}
	var i = iFix(a);
	var dA = Math.PI*.5;
	var swapxy = false;
	if(dir==2||dir==3) {
		swapxy = true;
	}
	if(dir==1||dir==2) {
			dA = -dA;
	}
	var iTop = iFix(a+dA);
	var iBot = iFix(a-dA);

	gs.color({rgb: [i, i, i]});
	gs.clear();

	gs.color({rgb: [139, 104, 120]});
	var size=4;
	var p=t;
	var d1=50;
	var d2=1;
	var p = [];
	p.push([d1, 0]);
	p.push([0, d1]);
	p.push([-d1, 0]);
	p.push([0, -d1]);
	gs.shape({p});

	function add(c) {
		if(swapxy) {
			var t = c[0];
			c[0] = c[1];
			c[1] = t;
		}
		p.push(c);
	}

	gs.color({rgb: [iTop, iTop, iTop]});
	p = [];
	add([d1+d2, 0]);
	add([0, d1+d2]);
	add([-d1-d2, 0]);
	add([-d1, 0]);
	add([0, d1]);
	add([d1, 0]);
	gs.shape({p});

	gs.color({rgb: [iBot, iBot, iBot]});
	p = [];
	add([d1+d2, 0]);
	add([0, -d1-d2]);
	add([-d1-d2, 0]);
	add([-d1, 0]);
	add([0, -d1]);
	add([d1, 0]);
	gs.shape({p});

	gs.update();
}
setInterval(pulse, 20);
