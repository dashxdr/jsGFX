#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var gk = gfx.k;
var mylog = console.log;
var edge = 1200;
var zoom = 0;
var best = 0;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==gk.ESCAPE && pressed) gfx.quit();
	if(code==gfx.asc(' ') && pressed) start();
	if(code==gfx.asc('z')) zoom = pressed;
	if(code==gfx.asc('b')) best = pressed;
	if(pressed && code>=gfx.asc('0') && code<=gfx.asc('1')) {
		maze.usePerm = code-gfx.asc('0');
//		start();
	}
	if(pressed && code==gfx.asc('f')) maze.fast = !maze.fast;
});
function perm(arr)
{
	if(arr.length<2) return [arr];
	var res = [];
	arr.forEach(function(x, i) {
		perm(arr.slice(0,i).concat(arr.slice(i+1))).forEach(function(a) {
			res.push([x].concat(a));
		});
	});
	return res;
}
var allDirs = perm([0,1,2,3]);

var maze = {usePerm:true};
function mazeInit(maze, w, h) {
	maze.arr = [];
	w|=1;
	if(!h) h=w;
	h|=1;
	if(w<3) w=3;
	if(h<3) h=3;
	for(var y=0;y<h;++y) {
		var row = [];
		for(var x=0;x<w;++x)
			row.push(1);
		maze.arr.push(row);
	}
	maze.w = w;
	maze.h = h;
	maze.path = [];
	maze.steps = 0;
	maze.done = false;
	maze.dir = 0;
	maze.best = false;
}
function mazeDraw(maze) {
	var size = 3;
	var size2 = size/2;
	var off = -100+size*2;
	var cOff = [0, 0, 0];
	var cOn = [255, 100, 64];
	if(!maze.usePerm) cOn[2] = 255;
	function pos(x,y) {
		return {x:x*size+off, y:y*size+off};
	}
	for(var y=0;y<maze.h;++y) {
		for(var x=0;x<maze.w;++x) {
			gs.color({rgb:maze.arr[y][x] ? cOn : cOff});
			var p = pos(x,y);
			p.dx = size2;
			p.dy = size2;
			gs.box(p);
		}
	}
	var path = maze.path;
	if(best && maze.best) path = maze.best;
	gs.pen({r:.7});
	var o = false;
	gs.color({rgb:[255, 255, 0]});
	path.forEach(function(p) {
		p = pos(p.x, p.y);
		p.dx = p.dy = 1;
		if(o) gs.vector({x:o.x, y:o.y, x2:p.x, y2:p.y});
		o = p;
	});
	gs.color({rgb:[255, 0, 0]});
	path.forEach(function(p) {
		p = pos(p.x, p.y);
		p.dx = p.dy = p.r = 1;
		gs.disc(p);
	});
}

function rand(x) {return Math.floor(Math.random()*x);}

function mazeStep(maze) {
	if(maze.done) return true;
	function off(x,y) {maze.arr[y][x] = 0;}
	function offPush(x,y) {off(x,y);maze.path.push({x,y});++maze.steps;}
	if(maze.path.length==0) {
		offPush(1,1);
		return;
	}
	var dx = [1, 0, -1, 0];
	var dy = [0, 1, 0, -1];
	for(;;) {
		if(maze.path.length==0) break;
		var p = maze.path[maze.path.length-1];
		if(maze.usePerm) {
			var dirs = allDirs[rand(allDirs.length)].slice(0);
		} else {
//			var dirs = [0,1,2,3];
//			for(var i=0;i<3;++i) {
//				var n = i+rand(4-i);
//				if(i==n) continue;
//				var t = dirs[i];
//				dirs[i] = dirs[n];
//				dirs[n] = t;
//			}
			var x = rand(4);
			var tt = -1;
			x = maze.dir + tt;
			var dirs = [];
			for(var i=0;i<4;++i) {
				dirs.push(x & 3);
				x-=tt;
			}
		}
		var found = false;
		while(dirs.length>0) {
			var d = dirs.shift();
			var x = p.x + dx[d]*2;
			var y = p.y + dy[d]*2;
			if(x<0 || y<0 || x>=maze.w || y>=maze.h) continue;
			if(maze.arr[y][x]==0) continue;
			off(p.x+dx[d], p.y+dy[d]);
			offPush(x,y);
			if(x==maze.w-2 && y==maze.h-2) maze.best = maze.path.slice(0);
			maze.dir = d;
			found = true;
			break;
		}
		if(found) break;
		maze.path.pop();
break;
	}
	if(maze.steps == (maze.w-1)*(maze.h-1)/4) {
		maze.done = true;
		mylog('Done!');
	}
	return false;
}

function start() {
	mazeInit(maze, 63);
}
start();

var t = 0.0;
function pulse() {
	gs.color({rgb: [0, 0, 0]});
	gs.clear();

	if(t%2==0) {
		var count = 1;
		if(maze.fast) count = 10000000;
		else if(zoom) count=10;
		while(count-- > 0) {
			if(mazeStep(maze)) break;
		}
	}
	mazeDraw(maze);

	gs.update();
	++t;
}
setInterval(pulse, 50);
