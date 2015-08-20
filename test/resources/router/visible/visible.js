'use strict';

var koa = require('koa');
var app = koa();
var router = require('koa-joi-router');
var r = router();

// Expose routes to docs generator
app.routes = r.routes;

r.get('/',
  {
    description: 'Freedom!',
    validate: {
      someKey: 'someValue'
    }
  },
  function* () {
    this.body = 'Hellloooooo world, look at me!';
  }
);

app.use(r.middleware());

module.exports = app;
