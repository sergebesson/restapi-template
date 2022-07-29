# restapi-template

```javascript
const server = new Serveur({
    host,
    port,
    basePath,
    ssl: {
      enable (false),
      keyFile,
      certFile,
    },
  })

const service = {logger}
await server.initialize({ modulesPath, services })
await server.start();
```

Dans le répertoire modulesPath :

```text
module1/
  openapi/
    openapi.yml
    responses.yml
    schemas.yml
  index.js
```

## Exemple d'un module _root_

Ces modules sont les 1er a être initialisé et donc les middleware seront les 1er a être exécuté avant même la mise en place de openapi

structure du fichier `index.js`

```javascript
class Module1 extends RootModuleInterface {
  constructor(services) {} // facultatif
  async initialize(modules) {} // facultatif, peut ne pas être async !
  async updateRootRouter({ router, apiPath }) { // peut ne pas être async
    router.use(function middleware(req, res, next) {}) // for exemple
    ...
  }
}
```

## Exemple d'un module _public_ 

Ces modules sont initialisés après la mise en place de openapi et donc les routes devront faire partie de l'API, mais elles seront avant les modules d'authentification permettant donc d'être accédé sans authentification préalable.

structure du fichier `index.js`

```javascript
class Module1 extends PublicModuleInterface {
  constructor(services) {} // facultatif
  async initialize(modules) {} // facultatif, peut ne pas être async !
  async routerFactory() { // peut ne pas être async
    const router = express.Router();
    ...
    return router
  }
}
```

## Exemple d'un module _authentification_

Ces modules ont pour but de gérer l'authentification (exemple création de token et validation du token), ils seront donc initialisés après les modules public

structure du fichier `index.js`

```javascript
class Module1 extends AuthentificationModuleInterface {
  constructor(services) {} // facultatif
  async initialize(modules) {} // facultatif, peut ne pas être async !
  async updateRootRouter({ router, apiPath }) {} // peut ne pas être async
    router.use(function middleware(req, res, next) {/* check authentification */}) // for example
    router.post(`/${apiPath}/token`, function middleware(req, res, next) {/* create token */})
    ...
  }
}
```

## Exemple d'un module _private_ 

Ces modules seront accessible après validation de l'authentification. Ils seront donc initialisés après les modules d'authentification

Module accessible si identifié
structure du fichier `index.js`

```javascript
class Module1 extends PrivateModuleInterface {
  constructor(services) {} // facultatif
  async initialize(modules) {} // facultatif, peut ne pas être async !
  async routerFactory() { // peut ne pas être async
    const router = express.Router();
    router.get("/", function middleware(req, res, next)); // for example
    ...
    return router
  }
}
```

## Exemple d'un module _error_

Ces modules ont pour but gérer les erreurs et seront donc initialisé en dernier.

error non géré par openapi
structure du fichier `index.js`

```javascript
class Module1 extends ErrorModuleInterface {
  constructor(services) {} // facultatif
  async initialize(modules) {} // facultatif, peut ne pas être async !
  async updateRootRouter({ router, apiPath }) {} // peut ne pas être async
    // error global
    router.use(function middleware(error, req, res, next) {/* manage error */})
    // error module
    router.use(`/${apiPath}`, function errorMiddleware(error, req, res, next) {/* manage error */})
    ...
  }
}
```
