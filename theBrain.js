#!/usr/bin/env node
"use strict";
var gfx = require('gfx');
var gs = gfx.s;
var mylog = console.log;
var edge = 600;
var mouse = {x:0,y:0};
var printCoords=0;
var mat4 = gfx.matrix.mat4;
var vec4 = gfx.matrix.vec4;
var width = edge;
var height = edge;
gfx.on('resize', function(vw, vh, w, h) {
mylog(vw, vh, w, h);
	width = w;
	height = h;
//	screen.vw = vw;screen.vh = vh;
//	screen.w = w;screen.h = h;
});
gfx.setup({w:width, h:height});
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
attribute vec4 vPosition;
uniform mat4 matrix;
varying vec4 position;
void main()
{
	gl_Position = matrix * vPosition;
	position = vPosition;
}
`;


const fsSource = `
#ifdef GL_ES
precision mediump float;
#endif
uniform vec3 CENTER, DIRECTION;
uniform float ROUND;
uniform float RC, RF;
uniform vec3 COLOR;
uniform vec3 LIGHTSOURCE;
varying vec4 position;

void main() {
	vec4 specular;
	float diffuse;
	vec2 rad = position.xy - CENTER.xy;
	float r;
	if(ROUND != 0.)
		r = length(rad);
	else
		r = dot(rad, DIRECTION.xy);

	float f = (r - RC) * RF;
	if(f > 1.0) discard;
	if(f < 0.0) f = 0.0;

	float f2 = sqrt(1.0 - f*f);

	vec3 norm;
	if(ROUND != 0.)
		norm = vec3(rad * f / r, f2);
	else
		norm = vec3(DIRECTION.xy * f, f2);

	vec3 lightVector;
	lightVector = LIGHTSOURCE.xyz - position.xyz;
	lightVector = normalize(lightVector);
	diffuse = max(0.0, dot(norm, lightVector)) + .2;

	vec3 camerapos = vec3(0.0, 0.0, 5000.0);
	vec3 cameraVector = normalize(camerapos - position.xyz);
	vec3 halfVector = normalize(lightVector + cameraVector);
	float nxHalf = max(0.0,dot(norm, halfVector));
	float specularPower = pow(nxHalf, 20.0) * 2.0;
	specular = vec4(1.0, 1.0, 1.0, 1.0) * specularPower;

	gl_FragColor = diffuse * vec4(COLOR.rgb,1.0) + specular;
}


`;
const shaderProgram = g.compile(vsSource, fsSource);

function drawScene() {
}
var time = 0;
function pulse() {
	g.clear({rgb:[0, 0, .25]});
	const fieldOfView = 45 * Math.PI / 180;
	const aspect = 1;
	const zNear = 0.1;
	const zFar = 100.0;
	const projectionMatrix = mat4.create();
//	mat4.perspective(projectionMatrix,
//		fieldOfView,
//		aspect,
//		zNear,
//		zFar);

	const pushback = 20.0;
	var fix = pushback * ((width<height) ? width : height);
	fix = 100.0 / fix;
	const right = fix * width;
	const left = -right;
	const top = fix * height;
	const bottom = -top;
	var sw = right * pushback;
	var sw2 = sw*2.0;
	var sh = top * pushback;
	var sh2 = sh*2.0;
	var dwidth = width;
	var dheight = height;
	const near = 1.0;
	const far = 1000.0;

	mat4.frustum(projectionMatrix, left, right, bottom, top, near, far);
	const modelViewMatrix = mat4.create();
	mat4.translate(modelViewMatrix,	
		modelViewMatrix,	
		[0.0, 0.0, -pushback]);
	var matrix = mat4.create();
	mat4.multiply(matrix, projectionMatrix, modelViewMatrix);

	var attributes = {vPosition:4,};
	var indent = 6;
	var wedgeSize = 40;
//	indent = wedgeSize*.3;
	var rc = wedgeSize-indent;
	var rf = 1/indent;
	var a = time*.01;
	var lr = 10;
	var la = time*.005;
	var uniforms = {
		matrix,
//		LIGHTSOURCE:[-40-lr*Math.cos(la), 40+lr*Math.sin(la), 8],
		LIGHTSOURCE:[mouse.x, mouse.y, 8],
		COLOR:[1., 0., 0.],
		ROUND:1,//1,
		CENTER: [0,0,0],
		RC:rc,
		RF:rf,
		DIRECTION:[Math.cos(a), Math.sin(a), 0],
	};
	var m = 50;

	var z=0;
	var w = 1;
	var array = [
		-m, m, z, w,
		 m, m, z, w,
		-m, -m, z, w,
		 m, -m, z, w,
	];
	var indexes = [0,1,2,3];
	var type = g.TRIANGLE_STRIP;
	var res = g.draw({program:shaderProgram, type, attributes, uniforms, array, indexes});
	
//	gs.color({rgb:[255,255,0]});
//	gs.disc({x:mouse.x, y:mouse.y, r:40});
	gs.update();
	++time;
}
setInterval(pulse, 20);

