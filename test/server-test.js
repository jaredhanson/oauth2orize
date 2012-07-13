var vows = require('vows');
var assert = require('assert');
var util = require('util');
var Server = require('server');


vows.describe('Server').addBatch({
  
  'Server': {
    topic: function() {
      return new Server();
    },
    
    'should wrap authorization middleware': function (server) {
      assert.isFunction(server.authorization);
      assert.lengthOf(server.authorization, 2);
      assert.strictEqual(server.authorize, server.authorization);
    },
    'should wrap decision middleware': function (server) {
      assert.isFunction(server.decision);
      assert.lengthOf(server.decision, 2);
    },
    'should wrap token middleware': function (server) {
      assert.isFunction(server.token);
      assert.lengthOf(server.token, 1);
    },
    'should wrap errorHandler middleware': function (server) {
      assert.isFunction(server.token);
      assert.lengthOf(server.token, 1);
    },
  },
  
  'newly initialized server': {
    topic: function() {
      return new Server();
    },
    
    'should have no request parsers': function (s) {
      assert.lengthOf(s._reqParsers, 0);
    },
    'should have no response handlers': function (s) {
      assert.lengthOf(s._resHandlers, 0);
    },
    'should have no exchangers': function (s) {
      assert.lengthOf(s._exchangers, 0);
    },
    'should have no client serializers or deserializers': function (s) {
      assert.lengthOf(s._serializers, 0);
      assert.lengthOf(s._deserializers, 0);
    },
  },
  
  'decision middleware': {
    topic: function() {
      var server = new Server();
      return server.decision;
    },
    
    'should have implicit transactionLoader': function (decision) {
      var mw = decision({});
      assert.isArray(mw);
      assert.lengthOf(mw, 2);
    },
    'should not have implicit transactionLoader if option disabled': function (decision) {
      var mw = decision({ loadTransaction: false });
      assert.isFunction(mw);
    },
  },
  
  'registering a grant module': {
    topic: function() {
      var self = this;
      var server = new Server();
      var mod = {};
      mod.name = 'foo';
      mod.request = function(req) {};
      mod.response = function(txn, res, next) {};
      server.grant(mod);
      
      return server;
    },
    
    'should have one request parsers': function (s) {
      assert.lengthOf(s._reqParsers, 1);
      assert.equal(s._reqParsers[0].type, 'foo');
      assert.isFunction(s._reqParsers[0].handle);
      assert.lengthOf(s._reqParsers[0].handle, 1);
    },
    'should have one response handlers': function (s) {
      assert.lengthOf(s._resHandlers, 1);
      assert.equal(s._resHandlers[0].type, 'foo');
      assert.isFunction(s._resHandlers[0].handle);
      assert.lengthOf(s._resHandlers[0].handle, 3);
    },
  },
  
  'registering a grant module by type': {
    topic: function() {
      var self = this;
      var server = new Server();
      var mod = {};
      mod.name = 'foo';
      mod.request = function(req) {};
      mod.response = function(txn, res, next) {};
      server.grant('bar', mod);
      
      return server;
    },
    
    'should have one request parsers': function (s) {
      assert.lengthOf(s._reqParsers, 1);
      assert.equal(s._reqParsers[0].type, 'bar');
      assert.isFunction(s._reqParsers[0].handle);
      assert.lengthOf(s._reqParsers[0].handle, 1);
    },
    'should have one response handlers': function (s) {
      assert.lengthOf(s._resHandlers, 1);
      assert.equal(s._resHandlers[0].type, 'bar');
      assert.isFunction(s._resHandlers[0].handle);
      assert.lengthOf(s._resHandlers[0].handle, 3);
    },
  },
  
  'registering a grant parsing function by type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('foo', function(req) {});
      
      return server;
    },
    
    'should have one request parsers': function (s) {
      assert.lengthOf(s._reqParsers, 1);
      assert.equal(s._reqParsers[0].type, 'foo');
      assert.isFunction(s._reqParsers[0].handle);
      assert.lengthOf(s._reqParsers[0].handle, 1);
    },
    'should have no response handlers': function (s) {
      assert.lengthOf(s._resHandlers, 0);
    },
  },
  
  'registering a grant parsing function by star': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('*', function(req) {});
      
      return server;
    },
    
    'should have one request parsers': function (s) {
      assert.lengthOf(s._reqParsers, 1);
      assert.isNull(s._reqParsers[0].type);
      assert.isFunction(s._reqParsers[0].handle);
      assert.lengthOf(s._reqParsers[0].handle, 1);
    },
    'should have no response handlers': function (s) {
      assert.lengthOf(s._resHandlers, 0);
    },
  },
  
  'registering a grant parsing function by type and phase': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('foo', 'request', function(req) {});
      
      return server;
    },
    
    'should have one request parsers': function (s) {
      assert.lengthOf(s._reqParsers, 1);
      assert.equal(s._reqParsers[0].type, 'foo');
      assert.isFunction(s._reqParsers[0].handle);
      assert.lengthOf(s._reqParsers[0].handle, 1);
    },
    'should have no response handlers': function (s) {
      assert.lengthOf(s._resHandlers, 0);
    },
  },
  
  'registering a grant responder function by type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('foo', 'response', function(txn, res, next) {});
      
      return server;
    },
    
    'should have no request parsers': function (s) {
      assert.lengthOf(s._reqParsers, 0);
    },
    'should have one response handlers': function (s) {
      assert.lengthOf(s._resHandlers, 1);
      assert.equal(s._resHandlers[0].type, 'foo');
      assert.isFunction(s._resHandlers[0].handle);
      assert.lengthOf(s._resHandlers[0].handle, 3);
    },
  },
  
  'registering a grant responder function by star': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('*', 'response', function(txn, res, next) {});
      
      return server;
    },
    
    'should have no request parsers': function (s) {
      assert.lengthOf(s._reqParsers, 0);
    },
    'should have one response handlers': function (s) {
      assert.lengthOf(s._resHandlers, 1);
      assert.isNull(s._resHandlers[0].type);
      assert.isFunction(s._resHandlers[0].handle);
      assert.lengthOf(s._resHandlers[0].handle, 3);
    },
  },
  
  'server with no request parsers': {
    topic: function() {
      var self = this;
      var server = new Server();
      var req = {};
      
      function parsed(err, areq) {
        self.callback(err, areq, req);
      }
      process.nextTick(function () {
        server._parse(null, req, parsed);
      });
    },
    
    'should not next with error': function (err, areq, req) {
      assert.isNull(err);
    },
    'should parse an empty object': function (err, areq, req) {
      assert.lengthOf(Object.keys(areq), 0);
    },
  },
  
  'server with no request parsers parsing a type': {
    topic: function() {
      var self = this;
      var server = new Server();
      var req = {};
      
      function parsed(err, areq) {
        self.callback(err, areq, req);
      }
      process.nextTick(function () {
        server._parse('code', req, parsed);
      });
    },
    
    'should not next with error': function (err, areq, req) {
      assert.isNull(err);
    },
    'should parse only type into object': function (err, areq, req) {
      assert.lengthOf(Object.keys(areq), 1);
      assert.equal(areq.type, 'code');
    },
  },
  
  'server with one request parsers handling a matching type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('code', function(req) {
        return { foo: '1' }
      })
      
      var req = {};
      
      function parsed(err, areq) {
        self.callback(err, areq, req);
      }
      process.nextTick(function () {
        server._parse('code', req, parsed);
      });
    },
    
    'should not next with error': function (err, areq, req) {
      assert.isNull(err);
    },
    'should parse object': function (err, areq, req) {
      assert.lengthOf(Object.keys(areq), 2);
      assert.equal(areq.type, 'code');
      assert.equal(areq.foo, '1');
    },
  },
  
  'server with one request parsers handling a non-matching type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('code', function(req) {
        return { foo: '1' }
      })
      
      var req = {};
      
      function parsed(err, areq) {
        self.callback(err, areq, req);
      }
      process.nextTick(function () {
        server._parse('unknown', req, parsed);
      });
    },
    
    'should not next with error': function (err, areq, req) {
      assert.isNull(err);
    },
    'should parse only type into object': function (err, areq, req) {
      assert.lengthOf(Object.keys(areq), 1);
      assert.equal(areq.type, 'unknown');
    },
  },
  
  'server with one request parsers handling a null type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('code', function(req) {
        return { foo: '1' }
      })
      
      var req = {};
      
      function parsed(err, areq) {
        self.callback(err, areq, req);
      }
      process.nextTick(function () {
        server._parse(null, req, parsed);
      });
    },
    
    'should not next with error': function (err, areq, req) {
      assert.isNull(err);
    },
    'should parse empty object': function (err, areq, req) {
      assert.lengthOf(Object.keys(areq), 0);
    },
  },
  
  'server with one star request parsers handling a type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('*', function(req) {
        return { foo: '1' }
      })
      
      var req = {};
      
      function parsed(err, areq) {
        self.callback(err, areq, req);
      }
      process.nextTick(function () {
        server._parse('code', req, parsed);
      });
    },
    
    'should not next with error': function (err, areq, req) {
      assert.isNull(err);
    },
    'should parse object': function (err, areq, req) {
      assert.lengthOf(Object.keys(areq), 2);
      assert.equal(areq.type, 'code');
      assert.equal(areq.foo, '1');
    },
  },
  
  'server with multiple request parsers handling a type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('*', function(req) {
        return { foo: '1' }
      })
      server.grant('code', function(req) {
        return { bar: '2' }
      })
      
      var req = {};
      
      function parsed(err, areq) {
        self.callback(err, areq, req);
      }
      process.nextTick(function () {
        server._parse('code', req, parsed);
      });
    },
    
    'should not next with error': function (err, areq, req) {
      assert.isNull(err);
    },
    'should parse object': function (err, areq, req) {
      assert.lengthOf(Object.keys(areq), 3);
      assert.equal(areq.type, 'code');
      assert.equal(areq.foo, '1');
      assert.equal(areq.bar, '2');
    },
  },
  
  'server with multiple request parsers, one being async, handling a type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('*', function(req, done) {
        return done(null, { async: 'yay' });
      })
      server.grant('code', function(req) {
        return { bar: '2' }
      })
      
      var req = {};
      
      function parsed(err, areq) {
        self.callback(err, areq, req);
      }
      process.nextTick(function () {
        server._parse('code', req, parsed);
      });
    },
    
    'should not next with error': function (err, areq, req) {
      assert.isNull(err);
    },
    'should parse object': function (err, areq, req) {
      assert.lengthOf(Object.keys(areq), 3);
      assert.equal(areq.type, 'code');
      assert.equal(areq.async, 'yay');
      assert.equal(areq.bar, '2');
    },
  },
  
  'server with multiple request parsers, one being async that errors, handling a type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('*', function(req, done) {
        return done(new Error('something went wrong'));
      })
      server.grant('code', function(req) {
        return { bar: '2' }
      })
      
      var req = {};
      
      function parsed(err, areq) {
        self.callback(err, areq, req);
      }
      process.nextTick(function () {
        server._parse('code', req, parsed);
      });
    },
    
    'should next with error': function (err, areq, req) {
      assert.instanceOf(err, Error);
      assert.equal(err.message, 'something went wrong')
    },
    'should not parse object': function (err, areq, req) {
      assert.isUndefined(areq);
    },
  },
  
  'server with no response handlers handling a transaction': {
    topic: function() {
      var self = this;
      var server = new Server();
      var txn = { req: { type: 'code' } };
      var res = {};
      res.end = function(data) {
        self.callback(new Error('should not be called'));
      }
      
      function responded(err) {
        self.callback(err);
      }
      process.nextTick(function () {
        server._respond(txn, res, responded);
      });
    },
    
    'should not next with error': function (err) {
      assert.isUndefined(err);
    },
  },
  
  'server with one response handler handling a transaction with matching type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.end('abc');
      });
      
      var txn = { req: { type: 'code' } };
      var res = {};
      res.end = function(data) {
        res._data = data;
        self.callback(null, txn, res);
      }
      
      function responded(err) {
        self.callback(new Error('should not be called'));
      }
      process.nextTick(function () {
        server._respond(txn, res, responded);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
    'should send response': function (err, req, res) {
      assert.equal(res._data, 'abc');
    },
  },
  
  'server with one response handler handling a transaction with non-matching type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.end('abc');
      });
      
      var txn = { req: { type: 'unknown' } };
      var res = {};
      res.end = function(data) {
        self.callback(new Error('should not be called'));
      }
      
      function responded(err) {
        self.callback(err);
      }
      process.nextTick(function () {
        server._respond(txn, res, responded);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
  },
  
  'server with one star response handler handling a transaction with matching type': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.grant('*', 'response', function(txn, res, next) {
        res.end('abc');
      });
      
      var txn = { req: { type: 'code' } };
      var res = {};
      res.end = function(data) {
        res._data = data;
        self.callback(null, txn, res);
      }
      
      function responded(err) {
        self.callback(new Error('should not be called'));
      }
      process.nextTick(function () {
        server._respond(txn, res, responded);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
    'should send response': function (err, req, res) {
      assert.equal(res._data, 'abc');
    },
  },
  
  'server with no exchangers': {
    topic: function() {
      var self = this;
      var server = new Server();
      var req = {};
      var res = {};
      
      function exchanged(err) {
        self.callback(err, req, res);
      }
      process.nextTick(function () {
        server._exchange(null, req, res, exchanged);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
  },
  
  'server with one exchanger registered with a named function with matching type': {
    topic: function() {
      var self = this;
      
      function code(req, res, next) {
        res.end('abc');
      }
      
      var server = new Server();
      server.exchange(code);
      var req = {};
      var res = {};
      res.end = function(data) {
        this._data = data;
        self.callback(null, req, res);
      }
      
      function exchanged(err) {
        self.callback(new Error('should not be called'));
      }
      process.nextTick(function () {
        server._exchange('code', req, res, exchanged);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
    'should send response': function (err, req, res) {
      assert.equal(res._data, 'abc');
    },
  },
  
  'server with one exchanger registered with a named function with non-matching type': {
    topic: function() {
      var self = this;
      
      function code(req, res, next) {
        res.end('abc');
      }
      
      var server = new Server();
      server.exchange(code);
      var req = {};
      var res = {};
      res.end = function(data) {
        self.callback(new Error('should not be called'));
      }
      
      function exchanged(err) {
        self.callback(err, req, res);
      }
      process.nextTick(function () {
        server._exchange('password', req, res, exchanged);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
  },
  
  'server with one exchanger registered with a named function with null type': {
    topic: function() {
      var self = this;
      
      function code(req, res, next) {
        res.end('abc');
      }
      
      var server = new Server();
      server.exchange(code);
      var req = {};
      var res = {};
      res.end = function(data) {
        self.callback(new Error('should not be called'));
      }
      
      function exchanged(err) {
        self.callback(err, req, res);
      }
      process.nextTick(function () {
        server._exchange(null, req, res, exchanged);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
  },
  
  'server with one exchanger registered with null type processing parsed type': {
    topic: function() {
      var self = this;
      
      var server = new Server();
      server.exchange(null, function(req, res, next) {
        res.end('abc')
      });
      var req = {};
      var res = {};
      res.end = function(data) {
        this._data = data;
        self.callback(null, req, res);
      }
      
      function exchanged(err) {
        self.callback(new Error('should not be called'));
      }
      process.nextTick(function () {
        server._exchange('code', req, res, exchanged);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
    'should send response': function (err, req, res) {
      assert.equal(res._data, 'abc');
    },
  },
  
  'server with one exchanger registered with null type processing null type': {
    topic: function() {
      var self = this;
      
      var server = new Server();
      server.exchange(null, function(req, res, next) {
        res.end('abc')
      });
      var req = {};
      var res = {};
      res.end = function(data) {
        this._data = data;
        self.callback(null, req, res);
      }
      
      function exchanged(err) {
        self.callback(new Error('should not be called'));
      }
      process.nextTick(function () {
        server._exchange(null, req, res, exchanged);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
    'should send response': function (err, req, res) {
      assert.equal(res._data, 'abc');
    },
  },
  
  'server with one exchanger registered with star type processing parsed type': {
    topic: function() {
      var self = this;
      
      var server = new Server();
      server.exchange('*', function(req, res, next) {
        res.end('abc')
      });
      var req = {};
      var res = {};
      res.end = function(data) {
        this._data = data;
        self.callback(null, req, res);
      }
      
      function exchanged(err) {
        self.callback(new Error('should not be called'));
      }
      process.nextTick(function () {
        server._exchange('code', req, res, exchanged);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
    'should send response': function (err, req, res) {
      assert.equal(res._data, 'abc');
    },
  },
  
  'server with one exchanger registered with star type processing null type': {
    topic: function() {
      var self = this;
      
      var server = new Server();
      server.exchange('*', function(req, res, next) {
        res.end('abc')
      });
      var req = {};
      var res = {};
      res.end = function(data) {
        this._data = data;
        self.callback(null, req, res);
      }
      
      function exchanged(err) {
        self.callback(new Error('should not be called'));
      }
      process.nextTick(function () {
        server._exchange(null, req, res, exchanged);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
    'should send response': function (err, req, res) {
      assert.equal(res._data, 'abc');
    },
  },
  
  'server with multiple exchangers processing parsed type': {
    topic: function() {
      var self = this;
      
      var server = new Server();
      server.exchange('*', function(req, res, next) {
        req._starred = true;
        next();
      });
      server.exchange('code', function(req, res, next) {
        res.end('abc')
      });
      var req = {};
      var res = {};
      res.end = function(data) {
        this._data = data;
        self.callback(null, req, res);
      }
      
      function exchanged(err) {
        self.callback(new Error('should not be called'));
      }
      process.nextTick(function () {
        server._exchange('code', req, res, exchanged);
      });
    },
    
    'should not next with error': function (err, req, res) {
      assert.isNull(err);
    },
    'should process through multiple middleware': function (err, req, res) {
      assert.isTrue(req._starred);
    },
    'should send response': function (err, req, res) {
      assert.equal(res._data, 'abc');
    },
  },
  
  'server with one exchanger that encounters an error': {
    topic: function() {
      var self = this;
      
      function code(req, res, next) {
        next(new Error('something went wrong'));
      }
      
      var server = new Server();
      server.exchange(code);
      var req = {};
      var res = {};
      res.end = function(data) {
        self.callback(new Error('should not be called'));
      }
      
      function exchanged(err) {
        self.callback(err, req, res);
      }
      process.nextTick(function () {
        server._exchange('code', req, res, exchanged);
      });
    },
    
    'should next with error': function (err, req, res) {
      assert.instanceOf(err, Error);
      assert.equal(err.message, 'something went wrong');
    },
  },
  
  'server with one exchanger that throws an exception': {
    topic: function() {
      var self = this;
      
      function code(req, res, next) {
        throw new Error('exception thrown');
      }
      
      var server = new Server();
      server.exchange(code);
      var req = {};
      var res = {};
      res.end = function(data) {
        self.callback(new Error('should not be called'));
      }
      
      function exchanged(err) {
        self.callback(err, req, res);
      }
      process.nextTick(function () {
        server._exchange('code', req, res, exchanged);
      });
    },
    
    'should next with error': function (err, req, res) {
      assert.instanceOf(err, Error);
      assert.equal(err.message, 'exception thrown');
    },
  },
  
  'server with no serializers': {
    topic: function() {
      var self = this;
      var server = new Server();
      function serialized(err, obj) {
        self.callback(err, obj);
      }
      process.nextTick(function () {
        server.serializeClient({ id: '1', name: 'Foo' }, serialized);
      });
    },
    
    'should fail to serialize client': function (err, obj) {
      assert.instanceOf(err, Error);
      assert.equal(err.message, 'Failed to serialize client.  Register serialization function using serializeClient().');
      assert.isUndefined(obj);
    },
  },
  
  'server with one serializer': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.serializeClient(function(client, done) {
        done(null, client.id);
      });
      function serialized(err, obj) {
        self.callback(err, obj);
      }
      process.nextTick(function () {
        server.serializeClient({ id: '1', name: 'Foo' }, serialized);
      });
    },
    
    'should serialize client': function (err, obj) {
      assert.isNull(err);
      assert.equal(obj, '1');
    },
  },
  
  'server with multiple serializers': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.serializeClient(function(client, done) {
        done('pass');
      });
      server.serializeClient(function(client, done) {
        done(null, 'second-serializer');
      });
      server.serializeClient(function(client, done) {
        done(null, 'should-not-execute');
      });
      function serialized(err, obj) {
        self.callback(err, obj);
      }
      process.nextTick(function () {
        server.serializeClient({ id: '1', name: 'Foo' }, serialized);
      });
    },
    
    'should serialize client': function (err, obj) {
      assert.isNull(err);
      assert.equal(obj, 'second-serializer');
    },
  },
  
  'server with a serializer that throws an error': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.serializeClient(function(client, done) {
        // throws ReferenceError: wtf is not defined
        wtf
      });
      function serialized(err, obj) {
        self.callback(err, obj);
      }
      process.nextTick(function () {
        server.serializeClient({ id: '1', name: 'Foo' }, serialized);
      });
    },
    
    'should fail to serialize client': function (err, obj) {
      assert.instanceOf(err, Error);
      assert.isUndefined(obj);
    },
  },
  
  'server with no deserializers': {
    topic: function() {
      var self = this;
      var server = new Server();
      function deserialized(err, client) {
        self.callback(err, client);
      }
      process.nextTick(function () {
        server.deserializeClient('1', deserialized);
      });
    },
    
    'should fail to deserialize client': function (err, client) {
      assert.instanceOf(err, Error);
      assert.equal(err.message, 'Failed to deserialize client.  Register deserialization function using deserializeClient().');
      assert.isUndefined(client);
    },
  },
  
  'server with one deserializer': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.deserializeClient(function(id, done) {
        done(null, { id: id });
      });
      function deserialized(err, client) {
        self.callback(err, client);
      }
      process.nextTick(function () {
        server.deserializeClient('1', deserialized);
      });
    },
    
    'should deserialize client': function (err, client) {
      assert.isNull(err);
      assert.equal(client.id, '1');
    },
  },
  
  'server with multiple deserializers': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.deserializeClient(function(id, done) {
        done('pass');
      });
      server.deserializeClient(function(id, done) {
        done(null, 'second-deserializer');
      });
      server.deserializeClient(function(id, done) {
        done(null, 'should-not-execute');
      });
      function deserialized(err, client) {
        self.callback(err, client);
      }
      process.nextTick(function () {
        server.deserializeClient('1', deserialized);
      });
    },
    
    'should deserialize client': function (err, client) {
      assert.isNull(err);
      assert.equal(client, 'second-deserializer');
    },
  },
  
  'server with one deserializer that sets client to null': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.deserializeClient(function(id, done) {
        done(null, null);
      });
      function deserialized(err, client) {
        self.callback(err, client);
      }
      process.nextTick(function () {
        server.deserializeClient('1', deserialized);
      });
    },
    
    'should invalidate client': function (err, client) {
      assert.isNull(err);
      assert.strictEqual(client, false);
    },
  },
  
  'server with one deserializer that sets client to false': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.deserializeClient(function(id, done) {
        done(null, false);
      });
      function deserialized(err, client) {
        self.callback(err, client);
      }
      process.nextTick(function () {
        server.deserializeClient('1', deserialized);
      });
    },
    
    'should invalidate client': function (err, client) {
      assert.isNull(err);
      assert.strictEqual(client, false);
    },
  },
  
  'server with multiple deserializers, the second of which sets client to null': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.deserializeClient(function(obj, done) {
        done('pass');
      });
      server.deserializeClient(function(obj, done) {
        done(null, null);
      });
      server.deserializeClient(function(obj, done) {
        done(null, 'should-not-execute');
      });
      function deserialized(err, client) {
        self.callback(err, client);
      }
      process.nextTick(function () {
        server.deserializeClient('1', deserialized);
      });
    },
    
    'should invalidate client': function (err, client) {
      assert.isNull(err);
      assert.strictEqual(client, false);
    },
  },
  
  'server with multiple deserializers, the second of which sets client to false': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.deserializeClient(function(obj, done) {
        done('pass');
      });
      server.deserializeClient(function(obj, done) {
        done(null, false);
      });
      server.deserializeClient(function(obj, done) {
        done(null, 'should-not-execute');
      });
      function deserialized(err, client) {
        self.callback(err, client);
      }
      process.nextTick(function () {
        server.deserializeClient('1', deserialized);
      });
    },
    
    'should invalidate client': function (err, client) {
      assert.isNull(err);
      assert.strictEqual(client, false);
    },
  },
  
  'server with a deserializer that throws an error': {
    topic: function() {
      var self = this;
      var server = new Server();
      server.deserializeClient(function(obj, done) {
        // throws ReferenceError: wtf is not defined
        wtf
      });
      function deserialized(err, client) {
        self.callback(err, client);
      }
      process.nextTick(function () {
        server.deserializeClient('1', deserialized);
      });
    },
    
    'should fail to deserialize client': function (err, obj) {
      assert.instanceOf(err, Error);
      assert.isUndefined(obj);
    },
  },
  
}).export(module);
