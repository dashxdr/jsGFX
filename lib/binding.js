#!/usr/bin/env node
"use strict";

var mylog = console.log;
var fs = require('fs');
var child_process = require('child_process');
var oName = 'binding.gyp';
var modName = 'mod';

var target = {};

var sdl2C = child_process.execSync('sdl2-config --cflags').toString().trim();
var sdl2L = child_process.execSync('sdl2-config --libs').toString().trim();

//mylog(sdl2C);
//mylog(sdl2L);

target.target_name = modName;
target.sources = process.argv.slice(2);
var dirs = [];
var defines = ['_STANDALONE_'];
sdl2C.split(' ').forEach(function(arg) {
	var f2 = arg.slice(0,2);
	var rest = arg.slice(2);
	if(f2=='-I') dirs.push(rest);
	else if(f2=='-D') defines.push(rest);
});
target.include_dirs = dirs;
target.defines = defines;
target.cflags = ['-Wall']; // -O3 seems to be automatically included

var libraries = [];
sdl2L.split(' ').forEach(function(arg) {
	var f2 = arg.slice(0,2);
	var rest = arg.slice(2);
	if(f2=='-L') libraries.push(rest + '/libSDL2.so');
	else libraries.push(arg);
});
libraries.push('-lpng');
libraries.push('-lmad');

target.link_settings = {libraries: libraries};

var o = {targets: [target]};

fs.writeFileSync(oName, JSON.stringify(o));
