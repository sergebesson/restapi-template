"use strict";

const http = require("http");
const https = require("https");

const express = require("express");
const compression = require("compression");
const fs = require("fs");

const { ModulesManager } = require("./services/modules-manager");
const { Openapi } = require("./services/openapi");
const moduleTypes = require("./services/module-types");

class Server {
	static async createServerAndStart ({ modulesPath, configuration, services = {} }) {
		const server = new Server(configuration);
		await server.initialize({ modulesPath, services });
		await server.start();

		return server;
	}

	#configuration = null;
	#app = express();
	#server = null;

	/**
	 * @param {object} configuration :
	 * {
	 *   host,
	 *   port,
	 *   ssl: {
	 *     enable (false),
	 *     keyFile,
	 *     certFile,
	 *   },
	 * }
	 */
	constructor (configuration) {
		this.#configuration = configuration;
	}

	async initialize ({ modulesPath, services }) {
		const context = { services };
		const modulesManager = new ModulesManager({ modulesPath });
		context.modules = await modulesManager.instantiate({ context });

		this.#app.use(compression());
		this.#app.use("/v1", await Server.#apiRouterFactory(modulesManager));
	}

	async start () {
		this.#server = this.#configuration.ssl.enable
			? https.createServer(
				{
					key: fs.readFileSync(this.#configuration.ssl.keyFile),
					cert: fs.readFileSync(this.#configuration.ssl.certFile),
				},
				this.#app,
			)
			: http.createServer(this.#app);

		return await new Promise((resolve, reject) => {
			this.#server.on("error", (error) => reject(error));
			this.#server.on("listening", () => resolve());
			this.#server.listen({
				port: this.#configuration.port,
				host: this.#configuration.host,
			});
		});
	}

	async stop () {
		if (!this.#server) {
			return Promise.reject(new Error("Server not running"));
		}

		return await new Promise((resolve, reject) => {
			this.#server.on("error", (error) => reject(error));
			this.#server.on("close", () => {
				this.#server = null;
				resolve();
			});
			this.#server.close();
		});
	}

	static async #apiRouterFactory (modulesManager) {
		// eslint-disable-next-line new-cap
		const router = express.Router();
		router.use(express.json());

		// root modules
		modulesManager.initializeRouterByType({ router, type: "root" });

		await Openapi.install({ router, modulesPath: modulesManager.modulesPath });

		// public modules
		modulesManager.initializeRouterByType({ router, type: "public" });

		// authentification modules
		modulesManager.initializeRouterByType({ router, type: "authentification" });

		// private module
		modulesManager.initializeRouterByType({ router, type: "private" });

		router.use(Openapi.middlewareError());

		// error module
		modulesManager.initializeRouterByType({ router, type: "error" });

		return router;
	}
}

module.exports = { Server, ...moduleTypes };
