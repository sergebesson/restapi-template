/* eslint-disable no-console */
"use strict";

const express = require("express");

const { PublicModuleType } = require("../../server/server");

class Info extends PublicModuleType {

	#myVar = "";

	constructor (args) {
		super();
		this.#myVar = "my var";
		console.log("Info::constructor", args);
	}

	initialize (args) {
		console.log("Info::initialize", args, this.#myVar);
	}

	// eslint-disable-next-line class-methods-use-this
	routerFactory () {
		console.log("Info::routerFactory", this.#myVar);
		// eslint-disable-next-line new-cap
		const router = express.Router();

		router.get("/", (request, response) => {
			console.log("Info::route::get::/", this.#myVar);
			response.status(200).json({ info: "information public" });
		});

		return router;

	}
}

module.exports = { Info };
