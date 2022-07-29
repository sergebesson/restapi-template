/* eslint-disable */
"use strict";

const _ = require("lodash")

class MyBaseClass {
	att = "MyBaseClass";
	method() {
		console.log("method")
	}
}

class MyClass extends MyBaseClass {
	att2 = "MyClass";
	method2() {
		console.log("method2")
	}
}

const a= new MyClass()

_.forEach(a.constructor, (v, k) => console.log("a:", k, v))
console.log("-->", MyClass.methods, a instanceof MyClass, a instanceof MyBaseClass)

return


async function test (time) {
	return await new Promise((resolve) => {
		setTimeout(() => {
			console.log("-->", time);
			return resolve();
		}, time * 1000);
	});
}

const times = [ 2, 1 ];
const times2 = [ 1.5, 0.5 ];

async function run () {
	await Promise.all(times.map(async (time) => await test(time)));
	await Promise.all(times2.map(async (time) => await test(time)));

	console.log("-------------------");

	times.forEach(async (time) => await test(time));
	times2.forEach(async (time) => await test(time));

}

run();
