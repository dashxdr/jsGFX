#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 1200;
var mouse = {x:0,y:0};
var printCoords=0;
gfx.setup({w:edge*1.5, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
	if(code==gfx.asc(' ') && pressed) printCoords=1;
});
gfx.on('motion', function(x, y) {mouse.x = x;mouse.y=y;});
var t = 0.0;

var tiles = gfx.loadpng('png/terrain_atlas.png');
mylog(tiles);
var head = [480, 544, 544, 640];
var waterfall = [672, 480, 768, 640];
var tree = [928, 0, 1024, 128];


function pulse() {
	gs.color({rgb: [255, 255, 255]});
	gs.clear();
	if(tiles) {
		var x1=0, y1=0, x2=1, y2=1;
		var cx = mouse.x/200+.5;
		var cy = mouse.y/200+.5;
		var grid = 32/1024;
		var e = grid*2;
		var grid2 = grid*.5;
		cx+=grid2;
		cy+=grid2;
		cx-=cx%grid;
		cy-=cy%grid;
		gs.restore({id:tiles.id, x:-100, y:-100, w:200, h:200, x1, y1, x2, y2});
		gs.restore({id:tiles.id, x:105, y:5, w:40, h:40, x1:cx-e, y1:cy-e, x2:cx+e, y2:cy+e});
		if(printCoords) {
			printCoords=0;
			mylog(cx*tiles.width, cy*tiles.height);
		}
		function put(x, y, ysize, arr) {
			var xf = 1/tiles.width;
			var yf = 1/tiles.height;
			var x1 = xf*(arr[0]+.5);
			var y1 = yf*(arr[1]+.5);
			var x2 = xf*(arr[2]-.5);
			var y2 = yf*(arr[3]-.5);
			var w = tiles.width;
			var h = tiles.height;
			var xsize = Math.abs(ysize*(arr[2]-arr[0])/(arr[3]-arr[1]));
			gs.restore({id:tiles.id, x, y, w:xsize, h:ysize, x1, y1, x2, y2});

		}
		put(105, -38, 40, head);
		put(105, 50, 40, waterfall);
		put(105, -80, 40, tree);

//		gs.restore({id:tiles.id, x:105, y:-38, w:40, h:40, x1:head[0], y1:head[1], x2:head[2], y2:head[3]});
//		gs.restore({id:tiles.id, x:105, y:50, w:40, h:40, x1:waterfall[0], y1:waterfall[1], x2:waterfall[2], y2:waterfall[3]});
//		gs.restore({id:tiles.id, x:105, y:-80, w:40, h:40, x1:tree[0], y1:tree[1], x2:tree[2], y2:tree[3]});

		cx=cx*200-100;
		cy=cy*200-100;
		var pen = .25;
		gs.pen({r:pen});
		
		for(var i=0;i<2;++i) {
			var j = i*pen;
			var c = i?255:0;
			gs.color({rgb:[c,c,c]});
			gs.vector({x:cx+j,y:-100,x2:cx+j, y2:100});
			gs.vector({x:-100,y:cy+j,x2:100,y2:cy+j});
		}

	}
	gs.update();
	++t;
}
setInterval(pulse, 20);
