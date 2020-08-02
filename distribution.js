#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var gk = gfx.k;
var ga = gfx.asc;
var mylog = console.log;
var edge = 1200;
var toggle = false;
var option = 2;
var avgR = 1;
var fast = false;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==ga('f')) fast = pressed;
	if(!pressed) return;
	if(code==27) gfx.quit();
	if(code==gk.RETURN) setup();
	if(code==ga(' ')) toggle=!toggle;
	if(code>=ga('0') && code<=ga('9')) {
		option = code-ga('0');
		setup();		
	}
});
var points;
var colors = [
	[160,40,40],
	[200,200,200],
	[255,255,255],
	[160,160,160],
	[140,0,0],
	[255,0,255],
];
function setup() {
	points = [];
	var types = 5;
	var f = 1.4;
	var sum = 0;
	for(var i=0;i<types;++i) sum += Math.pow(f,i);
	var count = 100+option*25;
	var hist = [];
	avgR = eachR(count);
	for(var i=0;i<count;++i) {
		var t = sum*(1-i/count);
		var t2 = 1;
		var k = 0;
		while(t>t2) {
			++k;
			t2+=Math.pow(f, k);
		}
		var o = {};
		o.x = Math.random();
		o.y = Math.random();
		o.kind = types-1-k;
		if(!hist[o.kind]) hist[o.kind] = 0;
		hist[o.kind]++;
		o.color = colors[o.kind];
		o.r = (o.kind*.6 + 2)*1.8;
		o.fx = o.fy = 0;
		points.push(o);
	}
	mylog(hist);
	var same = [];
	function eachR(n) {return 2*Math.sqrt(1.0 / n / 3.14159);}
	hist.forEach(function(n, ndx) {
		same[ndx] = eachR(n);
	});
//	mylog(same);
	points.forEach(function(o) {
		o.same = same[o.kind];
o.r = o.same*25;
	});
}
setup();
var t = 0.0;
function pulse() {
	var i = 220;
	gs.color({rgb: [i, i, i]});
	gs.clear();

	function fix(v) {
		if(v>.5) v-=1;
		else if(v<-.5) v+=1;
		return v;
	}
	function base(v) {return v-Math.floor(v);}
	function move() {
		for(var i=0;i<points.length;++i) {
			var p1 = points[i];
			for(var j=i+1;j<points.length;++j) {
				var p2 = points[j];
				var dx = fix(p2.x-p1.x);
				var dy = fix(p2.y-p1.y);
				var l2 = dx*dx + dy*dy;
				var l = Math.sqrt(l2);
				var d = avgR;
				if(!toggle && (p1.kind==p2.kind)) d=p1.same;
				var f = (l-d);
				if(l>0) l=1.0/l;
				var fp = 0;
				if(toggle && p1.kind==p2.kind) fp=f/l2/256;
				if(f>0) f=fp;
				f*=l/32;
				dx *= f;
				dy *= f;
				p1.fx += dx;
				p1.fy += dy;
				p2.fx -= dx;
				p2.fy -= dy;
			}
		}
		points.forEach(function(p) {
			p.x = base(p.x+p.fx);
			p.y = base(p.y+p.fy);
			p.fx = p.fy = 0;
		});
	}
	var times = toggle ? 8 : 2;
	if(fast) times=32;
	for(var i=0;i<times;++i) move();
	points.forEach(function(p) {
		var rim = p.r*.05;
		function one(x,y) {
			gs.color({rgb:p.color});
			gs.disc({x:x, y:y, r:p.r});
			gs.pen({r:rim});
			gs.color({rgb:[0,0,0]});
			gs.circle({x:x, y:y, r:p.r-rim});
		}
		function flip(v) {return v<0 ? v+200 : v-200;}
		var x = p.x*200-100;
		var y = p.y*200-100;
		var tr = p.r;
		var tl = -100+tr;
		var th = 100-tr;
		var doublex = x<tl || x>th;
		var doubley = y<tl || y>th;
		one(x,y);
		if(doublex) {
			var fx = flip(x);
			one(fx, y);
			if(doubley) {
				var fy = flip(y);
				one(fx, fy);
				one(x, fy);
			}
		} else if(doubley) one(x, flip(y));
			
	});

	gs.update();
	++t;
}
setInterval(pulse, 50);
