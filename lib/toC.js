#!/usr/bin/env node
"use strict";

var mylog = console.log;
var fs = require('fs');

var output = [];

process.argv.slice(2).forEach(function(arg) {
	var f = fs.readFileSync(arg);
	var len = f.length;
	arg = arg.replace(/[.]/g, '_');
	var arr = 'char ' + arg + '[' + len + ']';
	output.push(arr + ' = {');
	var line = '';
	for(var i=0;i<len;++i) {
		line += '0x' + f.readInt8(i).toString(16) + ',';
		if(line.length>=70 || i+1==len) {
			output.push(line);
			line='';
		}
	}
	output.push('};');
	output.push('');
});

mylog(output.join('\n'));
