var vows = require('vows');
var assert = require('assert');
var util = require('util');
var Server = require('server');


vows.describe('Server').addBatch({
  
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
    'should have no request validators': function (s) {
      assert.lengthOf(s._validators, 0);
    },
    'should have no client serializers or deserializers': function (s) {
      assert.lengthOf(s._serializers, 0);
      assert.lengthOf(s._deserializers, 0);
    },
  },
  
}).export(module);
