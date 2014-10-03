
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

  function test(app){
    return request(http.createServer(app.callback()))
  }

  function distortRoutes(apps) {
    var path;
    for (path in apps) {
      if (apps[path].path !== '/docs') {
        apps[path].path = path + 'derb';
      }
    }
  }

  function clarifyRoutes(apps) {
    var path;
    for (path in apps) {
      if (apps[path].path !== '/docs') {
        apps[path].path = path;
      }
    }
  }

  describe('uses resourcer apps', function () {
    it('that are mounted as expected', function (done) {
      assert.equal(5, mounted);
      done();
    });
  });

  describe('/docs', function () {
    describe('GET', function () {
      var html;
      it('responds with HTML text', function* () {
        var res = yield test(app).get('/docs').expect(200).end();

        assert(res.headers['content-type']);
        assert(res.headers['content-type'].indexOf('text/html') >= 0);

        html = res.text;
      });

      it('responds with the same result from cache', function* () {
        // Modify the source routes (mess with a path that isn't being used);
        distortRoutes(apps);

        var res = yield test(app).get('/docs').expect(200).end();

        assert(res.headers['content-type']);
        assert(res.headers['content-type'].indexOf('text/html') >= 0);

        assert.equal(html, res.text);

        // Undo modifications
        clarifyRoutes(apps);
      });

      it('should use the object cache if it is generated', function* () {
        docs.clearCache();
        yield test(app).get('/docs/json').expect(200).end();
        yield test(app).get('/docs').expect(200).end();
      });

      it('should not show hidden apps/routes in the response', function *() {
        assert(html.indexOf('/hidden') === -1);
      });
    });
  });

  describe('/docs/json', function () {
    describe('GET', function () {
      var docsObj;
      it('responds with an object containing a docs property', function* () {
        docs.clearCache();
        var res = yield test(app).get('/docs/json').expect(200).end();

        assert(Array.isArray(res.body.docs));
        docsObj = res.body.docs;
      });

      it('responds with the same result from cache', function* () {
        // Modify the source routes (mess with a path that isn't being used);
        distortRoutes(apps);

        var res = yield test(app).get('/docs/json').expect(200).end();

        assert(Array.isArray(res.body.docs));
        assert.deepEqual(docsObj, res.body.docs);

        // Undo modifications
        clarifyRoutes(apps);
      });

      it('has a docs property with valid paths and routes', function* () {
        docsObj.forEach(function(d) {
          assert(d.path, 'missing path', d);
          assert(d.routes, 'missing routes', d);
        });
      });

      it('hides apps that don\'t have exposed routes', function* () {
        var docAppPaths = docsObj.map(function (docApp) {
          return docApp.path;
        });
        Object.keys(apps).forEach(function (path) {
          if (path.indexOf('hidden') >= 0) {
            assert(docAppPaths.indexOf(path) === -1);
          }
        });
      });

      it('hides routes with hide: true in the configuration', function* () {
        docsObj.forEach(function (d) {
          d.routes.forEach(function (r) {
            assert(r.path.indexOf('/hidden') === -1);
          });
        });
      });
    });
  });
});
