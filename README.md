#koa-resourcer-docs

## Introduction
A simple documentation generator for [koa-resourcer](https://github.com/pebble/koa-resourcer).

App resources that have exposed routes will be parsed and documented.

## Use
In your app:
```js
var koa = require('koa');
var join = require('path').join;
var resource = require('koa-resourcer');
var docs = require('koa-resourcer-docs');

var app = koa();
resource(app, join(__dirname, 'resources'), docs.addResource);
app.listen();
```

In each resource app:
```js
var koa = require('koa');
var Router = require('koa-joi-router');

var router = Router();
var app = module.exports = koa();

// Expose routes to documentation generator
app.routes = router.routes;

// Define some routes...

app.use(router.middleware());
```

## Configuration
Add a description to the route config:
```js
router.get('/', {description: 'Home page'}, function* () {
  this.body = "Home page under construction since 2009";
});
```

Hide a resource by not exposing routes:
```js
// Expose routes to documentation generator
//app.routes = router.routes;
```

Hide individual routes in a resource app from documentation by adding `hide: true` to route metadata:
```js
// Documented route:
router.get('/', {description: 'Main route'}, function* () {
  this.body = 'Hello world';
});

// Hidden route:
router.get('/secretRoute', {description: 'Nobody here but us chickens.', hide: true}, function* () {
  this.body = 'This is a hidden world';
});
```

## Installation
```
npm install koa-resourcer-docs --save
```

## Sponsored by

[Pebble Technology!](https://getpebble.com)

## LICENSE

[MIT](/LICENSE)
