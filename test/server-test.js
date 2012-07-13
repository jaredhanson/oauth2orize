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
  
}).export(module);
