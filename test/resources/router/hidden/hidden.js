'use strict';

var koa = require('koa');
var app = koa();
var router = require('koa-joi-router');
var r = router();

r.get('/',
  {
    description: 'No one will be able to see this.'
  },
  function* () {
    this.body = 'Potato';
  }
);

app.use(r.middleware());

module.exports = app;
