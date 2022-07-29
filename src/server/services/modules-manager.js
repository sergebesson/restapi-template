"use strict";

const path = require("path");
const _ = require("lodash");
const requireGlob = require("require-glob");
const { pascalCase, pascalCaseTransformMerge } = require("pascal-case");
const { camelCase, camelCaseTransformMerge } = require("camel-case");
const { paramCase } = require("param-case");

const { UpdateRootRouterInterface, RouterFactoryInterface } = require("./module-interfaces");

class ModulesManager {
	#TYPES = [ "root", "public", "authentification", "private", "error" ];

	#path = null;
	#modulesByType = {};

	constructor ({ modulesPath }) {
		this.#path = modulesPath;
		this.#TYPES.forEach((type) => {
			this.#modulesByType[type] = [];
		});
	}

	async instantiate ({ context }) {
		const requireModules = await requireGlob("*/index.js", {
			cwd: this.#path,
			keygen: (option, fileObj) => {
				const parsedPath = path.parse(fileObj.path.replace(fileObj.base, ""));
				return parsedPath.dir.split("/")
					.filter((value) => value !== "");
			},
		});

		const modules = {};
		_.forEach(requireModules, (module, moduleName) => {
			const instanceName = camelCase(moduleName, { transform: camelCaseTransformMerge });
			const className = pascalCase(moduleName, { transform: pascalCaseTransformMerge });

			const instance = new module[className](context);
			const type = module[className].TYPE;

			if (!this.#TYPES.includes(type)) {
				throw new Error(`module '${instance.constructor.name}' has incorrect type '${type}'`);
			}

			modules[instanceName] = instance;
			this.#modulesByType[type].push({
				instance,
				apiPath: paramCase(instanceName),
				openapiPath: path.join(this.#path, moduleName),
			});
		});

		await Promise.all(
			_.map(
				modules,
				async (module) => {
					if (_.isFunction(module.initialize)) {
						await module.initialize({ ...context, modules });
					}
				},
			),
		);

		return modules;
	}

	getModulesByType (type) {
		return this.#modulesByType[type];
	}

	get modulesPath () {
		return this.#path;
	}

	async initializeRouterByType ({ router, type }) {
		await Promise.all(this.getModulesByType(type).map(
			async (module) => {
				if (module.instance instanceof UpdateRootRouterInterface) {
					return await module.instance.updateRootRouter(
						{ router, apiPath: module.apiPath },
					);
				}
				if (module.instance instanceof RouterFactoryInterface) {
					return router.use(
						`/${module.apiPath}`, await module.instance.routerFactory(),
					);
				}
				throw new Error(`module ${module.instance.constructor.name} is not a valid module`);
			},
		));
	}
}

module.exports = { ModulesManager };
