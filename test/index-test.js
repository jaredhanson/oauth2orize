var vows = require('vows');
var assert = require('assert');
var util = require('util');
var oauth2orize = require('index');
var Server = require('server');


vows.describe('oauth2orize').addBatch({
  
  'should export module function': function () {
    assert.strictEqual(oauth2orize, oauth2orize.createServer);
  },
  
  'should export functions': function () {
    assert.isFunction(oauth2orize.createServer);
  },
  
  'should export grant middleware': function () {
    assert.isObject(oauth2orize.grant);
    assert.isFunction(oauth2orize.grant.code);
    assert.isFunction(oauth2orize.grant.token);
    
    assert.strictEqual(oauth2orize.grant.authorizationCode, oauth2orize.grant.code);
    assert.strictEqual(oauth2orize.grant.implicit, oauth2orize.grant.token);
  },
  
  'should export exchange middleware': function () {
    assert.isObject(oauth2orize.exchange);
    assert.isFunction(oauth2orize.exchange.authorizationCode);
    assert.isFunction(oauth2orize.exchange.clientCredentials);
    assert.isFunction(oauth2orize.exchange.password);
    assert.isFunction(oauth2orize.exchange.refreshToken);
    
    assert.strictEqual(oauth2orize.exchange.code, oauth2orize.exchange.authorizationCode);
  },
  
  'createServer': {
    topic: function() {
      return oauth2orize.createServer();
    },
    
    'should return a Server' : function(s) {
      assert.instanceOf(s, Server);
    },
  },
  
}).export(module);
