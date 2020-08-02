#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gc = gfx.c;
var gs = gfx.s;
var gk = gfx.k;
var ga = gfx.asc;
var mylog = console.log;
var edge = 512;
var keyState = {};
var toggle = false;
var toggle2 = false;
function gTime() {return +new Date();}

var state = {};

function rand(x) {return Math.floor(Math.random()*x);}
gfx.setup({x:1400, y:800, w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
//	mylog('code=' + code, 'mod=' + mod, 'pressed=' + pressed);
	keyState[code] = pressed;
	if(code==27 && pressed) gfx.quit();
//	if(code==gk.F1 && pressed) initState(state);
	if(pressed) {
		if(code==gk.RETURN) reset(true);
		if(code==ga('b')) bestMove();
		if(code>=ga('3') && code<=ga('9')) resize(code-ga('3')+3);
		if(code==ga('0')) resize(10);
		if(code==ga('g')) {toggle=1;reset(true);}
		if(code==ga('f')) toggle2 = !toggle2;
		if(code==ga(' ')) toggle=!toggle;
//		if(code==gk.LCTRL) --state.rotate;
//		if(code==gk.LGUI || code==gk.LALT) ++state.rotate;
//		if(code==gk.UP) state.drop=true;
//		if(code==ga('p')) state.paused=!state.paused;
//		if(code==ga(' ')) state.swap = true;
//		if((mod&gk.MOD_SHIFT) && code>=ga('0') && code<=ga('9')) mylog(state);
	}
});
gfx.on('button', function(button, pressed, x, y) {
	if(!pressed || button!=1) return;
	click(x,y);
});

var side = 4;
var BOXSIZE;
var BOXSPACE;
var BOXSPACE2;
var INDENT;
var SIZE;
var moveQ = [];
function resetQ() {moveQ = [];}
reset(false);
function reset(shuffle) {
	state = {};
	SIZE = side*side;
	BOXSIZE = 22*4/side;
	BOXSPACE = BOXSIZE*2.2;
	BOXSPACE2 = BOXSPACE*.5;
	INDENT = BOXSPACE/32;
	var b = [];
	for(var i=0;i<SIZE;++i) b.push(i+1);
	if(shuffle) {
		for(var i=0;i<5000;++i) {
			var n = rand(SIZE-2)+1;
			var t = b[0];
			b[0] = b[n];
			b[n] = t;
		}
	}
	state.b = b;
	resetQ();
	state.maxLookahead = 0;
	state.moveCount = 0;
}
function resize(v) {
	side=v;
	toggle=0;
	reset();
}

function getXY(n) {
	return {x:n%side, y:Math.floor(n/side)};
}
function getPos(n) {
	var p = getXY(n);
	var c = .5*(side-1);
	return {x:(p.x-c)*BOXSPACE, y:(c-p.y)*BOXSPACE};
}

function click(x,y) {
	var best = 0;
	var bestd = 999999;
	for(var i=0;i<SIZE;++i) {
		var p = getPos(i);
		var dx = p.x - x;
		var dy = p.y - y;
		var d = dx*dx + dy*dy;
		if(d<bestd) {
			bestd = d;
			best = i;
		}
	}
	var eV = state.b.indexOf(SIZE);
	var c = getXY(best);
	var e = getXY(eV);
	var dx = c.x-e.x;
	var dy = c.y-e.y;
	if((dx==0) == (dy==0)) return;

	var step;
	if(dx==0) step = dy<0 ? -side : side;
	else step = dx<0 ? -1 : 1;
	while(eV!=best) {
		var o = eV;
		eV += step;
		var t = state.b[o];
		state.b[o] = state.b[eV];
		state.b[eV] = t;
	}
}

function rating1(b) {
	var i;
	for(i=0;i<SIZE;++i)
		if(b[i]!=i+1) break;
// include taxi distance of first out of place tile as penalty
	var lower = 0.;
	for(var j=0;j<SIZE;++j) {
		if(b[j]==j+1) continue;
		var want = getXY(j);
		var p = b.indexOf(j+1);
		var at = getXY(p);
		var d = Math.abs(want.x-at.x) + Math.abs(want.y-at.y);
		lower+=d/5000;
	}
	if(lower>0) i+=.9-lower;
	return i;
}
function rating2(b) {
	var r=0;
	for(var i=0;i<SIZE;++i)
		if(b[i]==i+1) ++r;
	return r;
}


function rating(b) {
	return rating1(b);
}

function bestMove() {
	if(moveQ.length>0) {
		makeMove();
		return;
	}
	var cr = rating(state.b);
	var upper = Math.floor(cr/side);
	if(upper>side-2) upper=side-2;
	if(cr==SIZE) {
		toggle=0;
		mylog('Solved in ' + state.moveCount + ' moves');
		return;
	}
	var s = {};
	function toName(x) {return x.join(',');}
	var list = [toName(state.b)];
	s[list[0]] = 1;
	var bestRating = -100;
	var i;
	var quit = 0;
	var oBest;
	for(i=0;i<20&&!quit;++i) {
		var nl = [];
		list.forEach(function(k) {
			var b = k.split(',');
			var n = b.indexOf(SIZE+'');
			var c = getXY(n);
			function try1(x,y) {
				x+=c.x;
				y+=c.y;
				if(y<upper) return;
				if(x<0 || x>=side || y<0 || y>=side) return;
				var tb = b.slice(0);
				var tn = y*side+x;
				tb[tn] = b[n];
				tb[n] = b[tn];
				var name = toName(tb);
				var e = s[name];
				if(e) {
return;
					if(e===1) return; // back to initial state
					if(i>=e.len) return; // better path exists
				}
				var r=rating(tb);
				e = {parent:k, len:i, rating:r};
				if(r>bestRating) {bestRating=r;oBest=name};
				s[name] = e;
//				if(r>bestRating-8)
					nl.push(name);
				if(r>Math.floor(cr)+1) quit=1;
//mylog(name, e.rating);
			}
			try1(1,0);
			try1(-1,0);
			try1(0,1);
			try1(0,-1);
		});
		list = nl;
	}
	if(i>state.maxLookahead) {
		state.maxLookahead=i;
	}
	function show(o) {
		mylog('Rating:', s[o].rating);
		var t = o.split(',');
		for(var i=0;i<side;++i) {
			var l = [];
			for(var j=0;j<side;++j) {
				var tt = t.shift();
				if(tt.length<2) tt=' '+tt;
				l.push(tt);
			}
			mylog(l.join(' '));
		}
		mylog('');
	}
	var o = oBest;
//	mylog(o, s[o].rating);
	var worst = 9999;
	for(;;) {
//		show(o);
		if(s[o].rating < worst) worst = s[o].rating;
		moveQ.push(o);
		var e = s[o];
		var p = e.parent;
		if(s[p]==1) break;
		o=p;
	}
//	mylog(o);
	function makeMove() {
		var k = moveQ.pop();
		k = k.split(',');
		k.forEach(function(v,idx) {
			k[idx] = parseInt(v);
		});
		state.b = k;
		++state.moveCount;
	}
	if(cr >= bestRating) {resetQ();toggle=0;}
	else makeMove();
	mylog(Object.keys(s).length + ', Max lookahead:'+ state.maxLookahead +
		', range='+(bestRating-worst));
}


function pulse() {
	gs.color({rgb: [0, 0, 64]});
	gs.clear();
	if(toggle2 && !toggle) {
		function update() {state.cont = gTime()+2000;}
		if(!state.cont) update();
		if(gTime()>state.cont) {
			toggle=true;reset(true);
			state.cont = false;
		}
	}
	if(toggle) bestMove();
	else resetQ();

	function toShape(l) {
		var r = [];
		l.forEach(function(p) {r.push([p.x, p.y]);});
		return r;
	}

	function drawSquare(n, rgb, bg) {
		var c = getPos(n);
		var b = square(c.x, c.y, BOXSPACE2);
		var p = [];
		p.push({rgb:bg || [0,0,0]});
		p = p.concat(toShape(b));
		p.push([]);
		p.push({rgb:rgb});
		p = p.concat(toShape(indent(b, INDENT)));
		gs.shape({p:p});
	}

	function drawTile(n,v) {
		if(v==SIZE) return;
		drawSquare(n, gc.white, gc.black);
		showNumber(n,v);
	}
	for(var i=0;i<SIZE;++i) {
		drawTile(i, state.b[i]);
	}

	gs.update();
}
setInterval(pulse, 20);
function indent(p, d) {
	function norm(a) {var m=1.0/(Math.sqrt(a.x*a.x+a.y*a.y)||1.0);return {x:a.x*m, y:a.y*m};}
	function sub(a,b) {return {x:a.x - b.x, y:a.y - b.y}};
	function add(a,b) {return {x:a.x + b.x, y:a.y + b.y}};
	function rot(a, radians) {var c = Math.cos(radians), s = Math.sin(radians);return{x:c*a.x+s*a.y,y:-s*a.x+c*a.y};}
	var p2 = [];
	var n = p.length;
	for(var i=0;i<n;++i) {
		var at = p[i];
		var next = p[(i+1)%n];
		var prev = p[(i+n-1)%n];
		var left = norm(sub(prev, at));
		var right = norm(sub(next, at));
		var center = norm(add(rot(left, 1.5707963267948966), rot(right, -1.5707963267948966)));
		var tr = center.x*right.x + center.y*right.y;
		var c = d/Math.sqrt(1.0 - tr*tr);
		p2.push({x:at.x + c*center.x, y:at.y + c*center.y});
	}
	return p2;
}

function square(x, y, e) {
	var r = [];
	function pp(dx, dy) {r.push({x:x+dx, y:y+dy});}
	pp(e, e);
	pp(-e, e);
	pp(-e, -e);
	pp(e, -e);
	return r;
}
// *********************

function showNumber(n,v) {
	var s1 = BOXSIZE*.25;
	var gap = s1*.125;
	var s2 = s1*.3;
	var s3 = s1-s2;
	var sx = s1*1.1;
	var sy = s1*2;
	var sy1 = sy + gap*2;
	var sy2 = sy*.5 + gap;
	function segment(x, y, seg) {
		var p = [];
		p.push({rgb: gc.black});
		function addP(dx, dy) {
			if(seg<3) {
				var t = dx;
				dx = -dy;
				dy = t;
				dy -= sy1*(seg-1);
			} else {
				var t = seg-3;
				dx += (t&1) ? sx : -sx;
				dy += (t&2) ? -sy2 : sy2;
			}
			p.push([x+dx+dy*.2, y+dy]);
		}
		addP(0, s1);
		addP(s2, s3);
		addP(s2, -s3);
		addP(0, -s1);
		addP(-s2, -s3);
		addP(-s2, s3);
		gs.shape({p:p});
	}

	function digit(x, y, dig) {
		var lookup = [0x7d, 0x50, 0x37, 0x57, 0x5a, 0x4f, 0x6f, 0x59, 0x7f, 0x5f];
		var bits = lookup[dig];
		for(var i=0;i<7;++i) {
			if(bits&1)
				segment(x, y, i);
			bits>>=1;
		}
	}
	var pos = getPos(n);
	var off = v>9 ? 1 : 0;
	var step = s1*3.5;
	off*=step*.4;
	for(var j=0;j<8;++j) {

		digit(pos.x-j*step+off, pos.y, v%10);
		v = Math.floor(v/10);
		if(!v) break;
	}
}
