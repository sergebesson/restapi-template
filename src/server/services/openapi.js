"use strict";

const _ = require("lodash");
const path = require("path");
const fastGlob = require("fast-glob");
const requireYml = require("require-yml");
const traverse = require("traverse");
const swaggerParser = require("swagger-parser");
const swaggerUiExpress = require("swagger-ui-express");
const expressOpenapiValidator = require("express-openapi-validator");

class Openapi {
	static async install ({ router, modulesPath }) {

		const apiSpec = await Openapi.#getApiSpec(modulesPath);
		console.log("Openapi::install", apiSpec);

		router.use("/api-docs", swaggerUiExpress.serve);
		router.get("/api-docs", swaggerUiExpress.setup(apiSpec, {
			swaggerOptions: {
				defaultModelRendering: "model",
				displayRequestDuration: true,
				docExpansion: "none",
				filter: true,
				showCommonExtensions: true,
			},
			customCss: ".swagger-ui section.models, .swagger-ui .topbar { display: none }",
		}));

		router.use(expressOpenapiValidator.middleware({
			apiSpec,
			validateRequests: true,
			validateResponses: true,
		}));
	}

	static middlewareError () {
		return (error, request, response, next) => {
			error.isOpenapiError = error instanceof expressOpenapiValidator.error.BadRequest ||
				error instanceof expressOpenapiValidator.error.Forbidden ||
				error instanceof expressOpenapiValidator.error.MethodNotAllowed ||
				error instanceof expressOpenapiValidator.error.NotAcceptable ||
				error instanceof expressOpenapiValidator.error.NotFound ||
				error instanceof expressOpenapiValidator.error.RequestEntityTooLarge ||
				error instanceof expressOpenapiValidator.error.Unauthorized ||
				error instanceof expressOpenapiValidator.error.UnsupportedMediaType ||
				error instanceof expressOpenapiValidator.error.InternalServerError;

			console.log("openapi::middlewareError", error);
			next(error);
		};
	}

	static async #getApiSpec (modulesPath) {
		const openapi = requireYml({ targets: "../openapi/openapi.yml", rootDir: __dirname });
		traverse(openapi).forEach(function updateRef (value) {
			/* eslint-disable no-invalid-this */
			if (this.key === "$ref" && !value.startsWith("#")) {
				this.update(path.join(__dirname, "../openapi", value));
			}
			/* eslint-enable no-invalid-this */
		});

		const openapiFiles = await fastGlob("./*/openapi/openapi.yml", { cwd: modulesPath });
		openapiFiles.sort().forEach((openapiFile) => {
			const openapiDir = path.dirname(openapiFile);
			const openapiModule = requireYml({ targets: openapiFile, rootDir: modulesPath });
			traverse(openapiModule).forEach(function updateRef (value) {
				/* eslint-disable no-invalid-this */
				if (this.key === "$ref" && !value.startsWith("#")) {
					this.update(path.join(modulesPath, openapiDir, value));
				}
				/* eslint-enable no-invalid-this */
			});
			const nameModule = path.join(openapiDir, "..");
			openapi.tags = [ ...openapi.tags, ...openapiModule.tags ];
			openapi.paths = {
				...openapi.paths,
				..._.mapKeys(
					openapiModule.paths,
					(value, openapiPath) => _.trimEnd(`/${nameModule}${openapiPath}`, "/"),
				),
			};
		});

		const apiSpec = await swaggerParser.validate(openapi);
		return apiSpec;
	}
}

module.exports = { Openapi };
