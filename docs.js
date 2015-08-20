'use strict';

var fs = require('fs');
var join = require('path').join;
var dot = require('dot');
var koa = require('koa');
var router = require('koa-joi-router');

var docs = module.exports = koa();
var r = router();

// If defined, custom middleware called by interceptRequest()
var requestHandler;

// holds the routes as they are added by koa-resourcer
var routes = [];

// expose routes to docs generator
docs.routes = r.routes;

var templatePath = join(__dirname, 'template.dot');
var template = loadTemplate(templatePath);

// holds the routes description object
var objCache = null;

// holds the compiled html routes description string data
var htmlCache = null;

/**
 * API documentation in JSON format
 */

r.get('/index.json',
  {
    description: 'API documentation in JSON format.'
  },
  interceptRequest,
  function*() {
    if (objCache) {
      this.body = objCache;
      return;
    }

    this.body = objCache = {
      docs: describeRoutes(routes)
    };
  });

/**
 * API documentation in human-readable HTML format
 */

r.get('/',
  {
    description: 'API documentation in human-readable HTML format.'
  },
  interceptRequest,
  function* () {
    if (htmlCache) {
      this.body = htmlCache;
      return;
    }

    if (objCache) {
      this.body = htmlCache = template(objCache);
      return;
    }

    objCache = {
      docs: describeRoutes(routes)
    };
    this.body = htmlCache = template(objCache);
  }
);

docs.use(r.middleware());

/**
 * Handles the route object passed to the resourcer callback
 * @api public
 */

docs.addRoute = function addRoute(o) {
  routes.push(o);
};

/**
 * Clear documentation cache
 * @api public
 */

docs.clearCache = function clearCache() {
  htmlCache = null;
  objCache = null;
};

/**
 * Override request handling middleware
 * @api public
 */

docs.useRequestHandler = function useRequestHandler(handler) {
  requestHandler = handler;
};

/**
 * Middleware to intercept the request and allow a custom handler.
 * @api private
 */

function* interceptRequest(next) {
  if (typeof requestHandler === 'function') {
    return yield requestHandler.call(this, next);
  } else {
    return yield next;
  }
}

/**
 * Load the documentation template.
 * @api private
 */

function loadTemplate(path) {
  try {
    return dot.compile(fs.readFileSync(path));
  } catch (e) {
    // Ignoring this line for code coverage until custom templates are supported.
    /* istanbul ignore next */
    return dot.compile('Failed to load documentation template from path: ' + path);
  }
}

/**
 * Produce the routes description object.
 * @api private
 */

function describeRoutes(routes) {
  return routes.filter(function(route) {
    return isObject(route.resource.routes);
  }).map(function(route) {
    return {
      path: route.path, routes: route.resource.routes.filter(function(route) {
        // Prefer using route.meta.hide over route.hide
        return !((route.meta && route.meta.hide) || route.hide);
      }).map(describeRoute)
    };
  });
}

/**
 * Produces a human readable description of the route.
 * @api private
 */

function describeRoute(route) {
  var ret = {};

  Object.keys(route).forEach(function(key) {
    if (key === 'handler') return;
    if (key === 'validate') return;
    ret[key] = route[key];
  });

  if (route.validate) {
    // this is the validation object being used by the routes themselves,
    // do not change this object.
    ret.validate = describeObject(route.validate);
  }

  return ret;
}

/**
 * Produces a human readable description of the route validators.
 * @api private
 */

function describeObject(o) {
  if (typeof o.describe === 'function') return o.describe();

  var ret = {};
  if (!isObject(o)) return o;

  Object.keys(o).forEach(function(key) {
    ret[key] = describeObject(o[key]);
  });

  return ret;
}

/**
 * @api private
 */

function isObject(o) {
  return typeof o === 'object' && o !== null;
}
