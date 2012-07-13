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
