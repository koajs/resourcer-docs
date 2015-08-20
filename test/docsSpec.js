'use strict';

var koa = require('koa');
var http = require('http');
var assert = require('assert');
var join = require('path').join;
var request = require('supertest');
var resource = require('koa-resourcer');
var docs = require('../');

// load co-mocha and other test utils
require('./test-setup');

describe('koa-resourcer-docs', function() {
  var app = koa();
  var mounted = 0;
  var path = join(__dirname, 'resources');
  var apps = {};

  resource(app, path, function(o) {
    apps[o.path] = o;
    docs.addRoute(o);
    ++mounted;
  });

  function test(app) {
    return request(http.createServer(app.callback()));
  }

  function polluteRoutes(apps, junk) {
    var path;
    for (path in apps) {
      if (apps[path].path !== '/docs') {
        apps[path].path = path + (junk || 'derb');
      }
    }
  }

  function cleanRoutes(apps) {
    var path;
    for (path in apps) {
      if (apps[path].path !== '/docs') {
        apps[path].path = path;
      }
    }
  }

  describe('uses resourcer apps', function() {
    it('that are mounted as expected', function* () {
      assert.equal(5, mounted);
    });
  });

  describe('route pollute / clean tools', function() {
    var junk = 'blah!';
    it('should distort the output', function* () {
      polluteRoutes(apps, junk);
      var res = yield test(app).get('/docs').expect(200).end();
      assert(res.text.indexOf(junk) >= 0);
    });

    it('should clean the output', function* () {
      cleanRoutes(apps);
      docs.clearCache();
      var res = yield test(app).get('/docs').expect(200).end();
      assert(res.text.indexOf(junk) === -1);
    });
  });

  describe('/docs', function() {
    before(function* () {
      cleanRoutes(apps);
      docs.clearCache();
    });

    describe('GET', function() {
      var html;
      it('responds with HTML text', function* () {
        var res = yield test(app).get('/docs').expect(200).end();

        assert(res.headers['content-type']);
        assert(res.headers['content-type'].indexOf('text/html') >= 0);

        html = res.text;
      });

      it('responds with the same result from cache', function* () {
        // Modify the source routes; if caching is being used the output should be
        // the same
        polluteRoutes(apps);

        var res = yield test(app).get('/docs').expect(200).end();

        assert(res.headers['content-type']);
        assert(res.headers['content-type'].indexOf('text/html') >= 0);

        assert.equal(html, res.text);

        // Undo modifications
        cleanRoutes(apps);
      });

      it('html output should use the object cache if it is generated', function* () {
        // This test is for 100% code coverage
        docs.clearCache();
        yield test(app).get('/docs/index.json').expect(200).end();
        yield test(app).get('/docs').expect(200).end();
      });

      it('should not show hidden apps/routes in the response', function* () {
        assert(html.indexOf('/hidden') === -1);
      });

      it('should prefer description from meta obj', function* () {
        assert(html.indexOf('Overridden') === -1);
        assert(html.indexOf('commanding') > 0);
      });
    });
  });

  describe('/docs/index.json', function() {
    before(function* () {
      cleanRoutes(apps);
      docs.clearCache();
    });

    describe('GET', function() {
      var docsObj;
      it('should call the optional request handler middleware if set', function* () {
        var requestHandled = false;
        docs.useRequestHandler(function* (next) {
          requestHandled = true;
          return yield next;
        });
        yield test(app).get('/docs').expect(200).end();
        assert(requestHandled, 'Request handler not called.');
        // Reset the request handler to default behavior
        docs.useRequestHandler();
      });
      it('responds with an object containing a docs property', function* () {
        var res = yield test(app).get('/docs/index.json').expect(200).end();

        assert(Array.isArray(res.body.docs));
        docsObj = res.body.docs;
      });

      it('responds with the same result from cache', function* () {
        // Modify the source routes; if caching is being used the output should be
        // the same
        polluteRoutes(apps);

        var res = yield test(app).get('/docs/index.json').expect(200).end();

        assert(Array.isArray(res.body.docs));
        assert.deepEqual(docsObj, res.body.docs);

        // Undo modifications
        cleanRoutes(apps);
      });

      it('has a docs property with valid paths and routes', function* () {
        docsObj.forEach(function(d) {
          assert(d.path, 'missing path', d);
          assert(d.routes, 'missing routes', d);
        });
      });

      it('hides apps that don\'t have exposed routes', function* () {
        var docAppPaths = docsObj.map(function(docApp) {
          return docApp.path;
        });
        Object.keys(apps).forEach(function(path) {
          if (path.indexOf('hidden') >= 0) {
            assert(docAppPaths.indexOf(path) === -1);
          }
        });
      });

      it('hides routes with hide: true in the configuration', function* () {
        docsObj.forEach(function(d) {
          d.routes.forEach(function(r) {
            assert(r.path.indexOf('/hidden') === -1);
          });
        });
      });
    });
  });
});
