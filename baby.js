#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var gc = gfx.c;
var ga = gfx.asc;
var gk = gfx.k;
var mylog = console.log;
var toggle = false;
var mouse = {x:0, y:0};
var fPos = 0;
var cycle = [];
var screen = {h:800};
screen.w = screen.h*1.6;
screen.vh = 100;
screen.vw = screen.vh*screen.w/screen.h;

gfx.setup({w:screen.w, h:screen.h});
gfx.on('key', function(code, mod, pressed) {
	if(!pressed) return;
	if(code==gk.ESCAPE) gfx.quit();
	if(code==ga(' ')) {toggle=!toggle;initGame();}
	if(code>=ga('1') && code<=ga('3')) fPos = code - ga('1');
	if(code>=gk.KP1 && code<=gk.KP3) fPos = code - gk.KP1;
});
gfx.on('motion', function(x, y) {mouse.x=x;mouse.y=y;});
gfx.on('resize', function(vw, vh, w, h) {
	screen.vw = vw;screen.vh = vh;
	screen.w = w;screen.h = h;
});

gfx.audio(audioFeed);
var chirps = [];
var deaths = [];
function audioFeed(n) {
	var arr = [];
	while(n-- > 0) {
		var sum = 0.0;
		var t = [];
		chirps.forEach(function(c) {
			sum += Math.sin(c*c*.00002)*.15;
			if(++c<4000) t.push(c);
		});
		chirps = t;
		t = [];
		deaths.forEach(function(c) {
			var v = c<5000 ? c*1.4 : c;
			sum += .05*((v*.01)%2 - 1);
			if(++c<10000) t.push(c);
		});
		deaths = t;
		arr.push(sum, sum);
	}
	return arr;
}

var t = 0.0;
function sprite() {
	this.dx = 0;
	this.dy = 0;
	this.p = [];
}
sprite.prototype.center = function(dx, dy) {
	this.dx = -dx;
	this.dy = -dy;
}
sprite.prototype.append = function(x, y, rgb, str) {
	var p = this.p;
	function addP() {p.push([x, y]);}
	x += this.dx;
	y += this.dy;
	y = -y;
	p.push({rgb:rgb});
	addP();
	while(str.length>0) {
		var n = 0;
		for(;;) {
			var c = str.slice(0,1);
			if(c<'0' || c>'9') break;
			n = n*10 + parseInt(c);
			str = str.slice(1);
		}
		n = n || 1;
		c = str.slice(0,1);
		str = str.slice(1);
		if(c=='u') y+=n;
		else if(c=='d') y-=n;
		else if(c=='l') x-=n;
		else if(c=='r') x+=n;
		addP();
	}
}
sprite.prototype.draw = function(o) {
	if(!o) o = {};
	var angle = o.angle || 0;
	var sin = Math.sin(angle);
	var cos = Math.cos(angle);
	var dx = o.x || 0;
	var dy = o.y || 0;
	var xz = o.xz || o.z || 1;
	var yz = o.yz || o.z || 1;

	var p = [];
	this.p.forEach(function(e) {
		if(!(e instanceof Array) || e.length==0) {
			p.push(e);
			return;
		}
		var eo = [];
		for(var i=0;i<e.length;i+=2) {
			var x = xz*e[i+0];
			var y = yz*e[i+1];
			eo.push(cos*x - sin*y + dx, sin*x + cos*y + dy);;
		}
		p.push(eo);
	});
	gs.shape({p});
}

var fireman, baby, pos;

function babyCount() {
	var c = 0;
	cycle.forEach(function(v) {c+=v;});
	return c;
}

function placeBaby() {
	function w(x) {return x>=0 && x<cycle.length && cycle[x];}
	for(;;) {
		var t = Math.floor(Math.random()*64);
		if(w(t-14)) continue;
		if(w(t-8)) continue;
		if(w(t-6)) continue;
		if(w(t)) continue;
		if(w(t+6)) continue;
		if(w(t+8)) continue;
		if(w(t+14)) continue;
		cycle[t] = 1;
		break;
	}
}
var nextTime = false;
var oldPos = false;
var newPos = false;
var lost = 0;
var wave = 5;
function initGame() {
	lost = 0;
	oldPos = newPos = false;
	nextTime = false;
	wave = 5;
	cycle = [];
	for(var i=0;i<64+26;++i) cycle[i] = 0;
	fPos = 0;
}

function setup() {
	fireman = new sprite();
	fireman.center(32, 11);
	fireman.append(4, 0, gc.red, '7rdrdrd13lu2ru2ru'); // red hat
	fireman.append(11, 0, gc.white, 'rdlu'); // white badge
	fireman.append(5, 3, gc.white, '5rd3rd2ldld3lulul2u'); // white head
	fireman.append(10, 3, gc.blue, 'rdlu'); // blue eye
	fireman.append(6, 7, gc.red, '5rd2rd2rdldl2dld7lur2ul3uru'); // red torso
	fireman.append(14, 10, gc.magenta, '3rd2r2d3lu2l2u'); // purple gloves
	fireman.append(5, 14, gc.blue, '7rdr2dr2drdrd5l2ululdl2d5lururur2ul2u'); // blue pants
	fireman.append(17, 10, gc.white, '15r2d13lu2lu'); // white trampoline

	baby = new sprite();
	baby.center(6.5, 8);
	baby.append(5, 0, gc.white, '3rdr2dl2d2rdrdrurdld2lul2dld3lul2uld2lulurdruru2r2ul2uru'); // upper
	baby.append(5, 1, gc.blue, 'rdlu'); // left eye
	baby.append(7, 1, gc.blue, 'rdlu'); // right eye
	baby.append(6, 3, gc.blue, 'rdlu'); // mouth
	baby.append(4, 10, gc.blue, '5r2dl2d3l2ul2u'); // shorts
	baby.append(1, 11, gc.white, 'rd3r2d2lu2l2u'); // left leg
	baby.append(11, 11, gc.white, 'r2d2ld2l2u3ru'); // right leg

	pos = [];
	// 26 babies
	function ap(x, y, r) {pos.push({x, y, r});}
	ap(1,32,1);ap(28,34,2);ap(41,48,3);ap(50,64,4);ap(55,82,1);ap(60,110,2);ap(62,127,3);ap(60,152,4);ap(62,171,1); // 8
	ap(77,160,2);ap(86,141,3);ap(93,122,4);ap(111,108,1);ap(127,122,2);ap(136,141,3);ap(147,157,4);ap(152,171,1); // 16
	ap(167,153,2);ap(180,140,3);ap(197,129,4);ap(214,140,1);ap(228,157,3);ap(242,171,1); // 22
	ap(256,152,1);ap(271,134,3);ap(300,139,1);
	initGame();
}
setup();

function pulse() {
	var now = +new Date();
	var gap = 1000/8.8;
	if(!nextTime) nextTime = now+gap;
	if(now >= nextTime) {
		nextTime += gap;
		step();
	}


	function step() {
		cycle.pop();
		cycle.unshift(0);
		oldPos = newPos;
		newPos = fPos;
		var bc = babyCount();
		if(!toggle) { // demo mode
			if(bc < 8) placeBaby();
			fPos = 0;
			for(var i=0;i<8;++i) {
				if(cycle[64+8-i]) {fPos = 0;break;}
				if(cycle[64+16-i]) {fPos = 1;break;}
				if(cycle[64+22-i]) {fPos = 2;break;}
			}
		} else {
			if(bc==0) for(var i=0;i<wave;++i) placeBaby();
			function checkBaby(n, at) {
				if(!cycle[64+n]) return;
				if(at==oldPos || at==newPos) {
					chirps.push(0);
					return;
				}
				deaths.push(0);
				cycle[64+n] = 0;
				++lost;
			}
			checkBaby(8, 0);
			checkBaby(16, 1);
			checkBaby(22, 2);
		}
	}

	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	var width = 320;
	var height = 200;
	var w2 = width*.5;
	var h2 = height*.5;

	var w = screen.vh*width/height;
	var h = screen.vh;
	if(w>screen.vw) {
		h = screen.vw*height/width;
		w = screen.vw;
	}
	if(0) { // green frame
		var r = 1;
		gs.pen({r});
		gs.color({rgb: gc.green});
		gs.rect({x:0, y:0, dx:w-r*.5, dy:h-r*.5});
	}

	function fixX(x) {return (x-w2)*w/w2;}
	function fixY(y) {return -(y-h2)*h/h2;}

	var z = fixX(1)-fixX(0);

	var fx = fixX([62, 152, 242][fPos]);
	var fy = fixY(178);
	var fa = mouse.x*.1 * 0;
	fireman.draw({angle:fa, x:fx, y:fy, xz:z, yz:z});
	fireman.draw({angle:fa, x:fx, y:fy, xz:-z, yz:z});
	function draw(n) {
		var p = pos[n];
		baby.draw({x:fixX(p.x), y:fixY(p.y), angle:(p.r-1)*3.141592/2, z});
	}
	for(var i=0;i<26;++i) {
		if(cycle[i+64])
			draw(i);
	}
	var a = Math.sin(now*.01)*.3;
	for(var i=0;i<lost;++i) {
		baby.draw({x:fixX(310-i*14), y:fixY(10), z, angle:a});
	}

	function marker(x, y) {
		gs.color({rgb: gc.red});
		gs.disc({x, y, r:1});
	}

	gs.update();

}
setInterval(pulse, 20);
