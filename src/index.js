/* eslint-disable no-console */
"use strict";

const path = require("path");

const { Server } = require("./server/server");

async function run () {

	console.log();
	console.log("Server starting ...");
	const configuration = { host: "localhost", port: 8080, ssl: {} };
	const server = await Server.createServerAndStart({
		modulesPath: path.join(__dirname, "modules"),
		configuration,
		services: { myService: "my service" },
	});

	process.on("SIGINT", () => {
		console.log();
		console.log("Server stopping ...");
		server.stop()
			.then(() => {
				/* eslint-disable-next-line no-console */
				console.log("Server stopped");
				process.exitCode = 0;
			})
			.catch((error) => {
				console.log(`impossible server stop : ${error.message}`);
				process.exitCode = 1;
			});
	});

	console.log("Server started");
	console.log("info", `start server to ${
		configuration.host
	}:${
		configuration.port
	} ${configuration.ssl.enable ? "in ssl mode" : ""}`);
}

run().catch((error) => console.log(`impossible server start : ${error.message}`));
