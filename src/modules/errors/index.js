"use strict";

const { ErrorModuleType } = require("../../server/server");

class Errors extends ErrorModuleType {
	// eslint-disable-next-line class-methods-use-this
	updateRootRouter ({ router }) {

		router.use((request, response) => response.status(404).json({
			status: 404, error_description: "Not Found",
		}));

		// eslint-disable-next-line no-unused-vars
		router.use((error, request, response, next) => {
			console.log(error);
			// Route d'erreur de json parser
			if (error.type === "entity.parse.failed") {
				return response.status(400).json({
					status: 400,
					error_description: "Bad Request",
					errors: [ { codeError: "badJson", messageError: "body is not json" } ],
				});
			}

			if (error.isOpenapiError) {
				console.log("Errors", error);
			}

			// logger.log("error", error.stack || error.message);
			return response.status(500).json({
				status: 500, error_description: "Internal Server Error",
			});
		});

	}
}
module.exports = { Errors };
