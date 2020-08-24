#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 600;
var mouse = {x:0,y:0};
var printCoords=0;
var mat4 = gfx.matrix.mat4;
gfx.setup({w:edge, h:edge});
gfx.on('key', function(code, mod, pressed) {
	if(code==27 && pressed) gfx.quit();
	if(code==gfx.asc(' ') && pressed) printCoords=1;
});
gfx.on('motion', function(x, y) {mouse.x = x;mouse.y=y;});

var g = gfx.g;
const vsSource = `
#ifdef GL_ES
precision mediump float;
#endif
attribute vec4 vertexPosition;
attribute vec3 vertexColor;
attribute vec3 vertexNormal;
uniform mat4 matrix;
varying vec3 color;
varying vec3 normal;
varying vec4 position;
void main() {
	color = vertexColor;
	normal = vertexNormal;
	position = gl_Position = matrix * vertexPosition;
}
`;
const fsSource = `
#ifdef GL_ES
precision mediump float;
#endif
varying vec4 position;
varying vec3 color;
void main() {
	vec2 pos = gl_FragCoord.xy;
	float d = 1.-length(pos - vec2(300))*.004;
	vec3 col = color*d + vec3(0,0,.2*fract(position.x));
	gl_FragColor = vec4(col, 1.0);
}`;
const shaderProgram = g.compile(vsSource, fsSource);

function drawScene() {
}
function pulse() {
	g.clear({rgb:[0, 0, .25]});
	const fieldOfView = 45 * Math.PI / 180;
	const aspect = 1;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
	mat4.perspective(projectionMatrix,
		fieldOfView,
		aspect,
		zNear,
		zFar);
	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix,	
		modelViewMatrix,	
		[-0.0, 0.0, -3.0]);
	var matrix = mat4.create();
	mat4.multiply(matrix, projectionMatrix, modelViewMatrix);
	var attributes = {vertexPosition:2, vertexColor:3};
	var uniforms = {matrix};
	var array = [
		-1.0, 1.0,1,0,0,
		 1.0, 1.0,0,1,0,
		-1.0, -1.0,0,0,1,
		 1.0, -1.0,1,1,1,
	];
	var indexes = [0,1,2,3];
	var type = g.TRIANGLE_STRIP;
	var res = g.draw({program:shaderProgram, type, attributes, uniforms, array, indexes});
	
//	gs.color({rgb:[255,255,0]});
//	gs.disc({x:mouse.x, y:mouse.y, r:40});
	gs.update();
}
setInterval(pulse, 20);

