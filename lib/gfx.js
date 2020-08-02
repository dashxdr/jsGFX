"use strict";

var mylog = console.log;
const EventEmitter = require('events');
class My_Emitter extends EventEmitter {}
const emitter = new My_Emitter();

var mod = require('./mod');
exports.s = mod.s;

function newBuffer(len) {
	return Buffer.alloc(len);
}

var eventHandlers = {
	motion: function(msg) {emitter.emit('motion', msg.x, msg.y);},
	button: function(msg) {emitter.emit('button', msg.button, msg.pressed, msg.x, msg.y);},
	key: function(msg) {emitter.emit('key', msg.code, msg.mod, msg.pressed);},
	wheel: function(msg) {emitter.emit('wheel', msg.v);},
	resize: function(msg) {emitter.emit('resize', msg.vw, msg.vh, msg.w, msg.h);},
	log: function(msg) {mylog('log:', msg.msg);},
	test: function(msg) { mylog('test received');},
};
function processEvents(events) {
	events.forEach(function(e) {
		emitter.emit('event', e);
		var func = eventHandlers[e.type];
		if(func) func(e);
	});
}

exports.send = function(data) {
	var func = exports.s[data.cmd];
	if(func) {
		func(data);
	} else mylog('fail!', data.cmd);
}

exports.on = function(ev, func) {emitter.on(ev, func);}
exports.once = function(ev, func) {emitter.once(ev, func);}
exports.emit = function() {emitter.emit.apply(emitter, arguments);}
exports.quit = function() {mod.quit();process.kill(process.pid, 'SIGINT');}
exports.asc = function(c) {return c.charCodeAt(0);}
exports.k = mod.k; // keycodes
exports.c = {
	orange:[255,150,0],
	red:[255,0,0],
	black:[0,0,0],
	white:[255,255,255],
	green:[0,255,0],
	blue:[0,0,255],
	yellow:[255,255,0],
	cyan:[0,255,255],
	magenta:[255,0,255],
	grey200:[200,200,200],
	grey180:[180,180,180],
	chocolate:[210,105,30],
	brown:[165,42,42],
};
exports.audio = function(f) {mod.audio = f;}
exports.loadmp3 = mod.loadmp3;

exports.setup = function(o) {
	var side = 1024;
	var pos = 100;
	if(o===undefined) o={};
	else if(typeof o == 'number') o={w:o, h:o}
	if(!o.w) o.w=side;
	if(!o.h) o.h=side;
	if(!o.x) o.x=pos;
	if(!o.y) o.y=pos;
	if(!mod.setup(o.x,o.y,o.w,o.h)) {
		emitter.emit('connect');
		setInterval(function() {
			var events = mod.pollInput();
			if(events) processEvents(events);
			var n = mod.pollAudio();
			if(n>0) {
				if(mod.audio)
					mod.feedAudio(mod.audio(n));
			}
		}, 10);
	}

	function mycc() {
		mylog('Exit...');
		process.removeListener('SIGINT', mycc);
		process.kill(process.pid, 'SIGINT');
		engine.kill('SIGINT');
	}
	process.on('SIGINT', mycc);
	process.on('SIGTERM', mycc);
}
