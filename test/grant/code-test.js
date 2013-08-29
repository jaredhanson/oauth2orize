var vows = require('vows');
var assert = require('assert');
var util = require('util');
var code = require('../../lib/grant/code');


function MockRequest() {
}

function MockResponse() {
  this._headers = {};
  this._data = '';
}

MockResponse.prototype.setHeader = function(name, value) {
  this._headers[name] = value;
}

MockResponse.prototype.redirect = function(location) {
  this._redirect = location;
  this.end();
}

MockResponse.prototype.end = function(data, encoding) {
  this._data += data;
  if (this.done) { this.done(); }
}


vows.describe('code').addBatch({

  // OK
  'middleware': {
    topic: function() {
      return code(function() {});
    },
    
    'should return a module named code' : function(mod) {
      assert.equal(mod.name, 'code');
    },
    'should return a module with request and response functions' : function(mod) {
      assert.isFunction(mod.request);
      assert.isFunction(mod.response);
    },
  },
  
  // OK
  'request parsing function that receives a request': {
    topic: function() {
      return code(function() {});
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1'
        };

        process.nextTick(function () {
          try {
            var obj = code.request(req);
            self.callback(null, obj);
          } catch (e) {
            self.callback(e);
          }
        });
      },

      'should not throw' : function(err, obj) {
        assert.isNull(err);
      },
      'should parse request' : function(err, obj) {
        assert.equal(obj.clientID, 'c123');
        assert.equal(obj.redirectURI, 'http://example.com/auth/callback');
        assert.isUndefined(obj.scope);
        assert.equal(obj.state, 'f1o1o1');
      },
    },
  },
  
  // OK
  'request parsing function that receives a request with scope': {
    topic: function() {
      return code(function() {});
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read'
        };

        process.nextTick(function () {
          try {
            var obj = code.request(req);
            self.callback(null, obj);
          } catch (e) {
            self.callback(e);
          }
        });
      },

      'should not throw' : function(err, obj) {
        assert.isNull(err);
      },
      'should parse request' : function(err, obj) {
        assert.equal(obj.clientID, 'c123');
        assert.equal(obj.redirectURI, 'http://example.com/auth/callback');
        assert.isArray(obj.scope);
        assert.lengthOf(obj.scope, 1);
        assert.equal(obj.scope[0], 'read');
        assert.equal(obj.state, 'f1o1o1');
      },
    },
  },
  
  // OK
  'request parsing function that receives a request with list of scopes': {
    topic: function() {
      return code(function() {});
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read write'
        };

        process.nextTick(function () {
          try {
            var obj = code.request(req);
            self.callback(null, obj);
          } catch (e) {
            self.callback(e);
          }
        });
      },

      'should not throw' : function(err, obj) {
        assert.isNull(err);
      },
      'should parse request' : function(err, obj) {
        assert.equal(obj.clientID, 'c123');
        assert.equal(obj.redirectURI, 'http://example.com/auth/callback');
        assert.isArray(obj.scope);
        assert.lengthOf(obj.scope, 2);
        assert.equal(obj.scope[0], 'read');
        assert.equal(obj.scope[1], 'write');
        assert.equal(obj.state, 'f1o1o1');
      },
    },
  },
  
  // OK
  'request parsing function using scope separator that receives a request with list of scopes': {
    topic: function() {
      return code({ scopeSeparator: ',' }, function() {});
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read,write'
        };

        process.nextTick(function () {
          try {
            var obj = code.request(req);
            self.callback(null, obj);
          } catch (e) {
            self.callback(e);
          }
        });
      },

      'should not throw' : function(err, obj) {
        assert.isNull(err);
      },
      'should parse request' : function(err, obj) {
        assert.equal(obj.clientID, 'c123');
        assert.equal(obj.redirectURI, 'http://example.com/auth/callback');
        assert.isArray(obj.scope);
        assert.lengthOf(obj.scope, 2);
        assert.equal(obj.scope[0], 'read');
        assert.equal(obj.scope[1], 'write');
        assert.equal(obj.state, 'f1o1o1');
      },
    },
  },
  
  // OK
  'request parsing function using multiple scope separators that receives a request with list of scopes': {
    topic: function() {
      return code({ scopeSeparator: [' ', ','] }, function() {});
    },
    
    'when handling a request with space scope separator': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read write'
        };

        process.nextTick(function () {
          try {
            var obj = code.request(req);
            self.callback(null, obj);
          } catch (e) {
            self.callback(e);
          }
        });
      },

      'should not throw' : function(err, obj) {
        assert.isNull(err);
      },
      'should parse request' : function(err, obj) {
        assert.equal(obj.clientID, 'c123');
        assert.equal(obj.redirectURI, 'http://example.com/auth/callback');
        assert.isArray(obj.scope);
        assert.lengthOf(obj.scope, 2);
        assert.equal(obj.scope[0], 'read');
        assert.equal(obj.scope[1], 'write');
        assert.equal(obj.state, 'f1o1o1');
      },
    },
    
    'when handling a request with comma scope separator': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read,write'
        };

        process.nextTick(function () {
          try {
            var obj = code.request(req);
            self.callback(null, obj);
          } catch (e) {
            self.callback(e);
          }
        });
      },

      'should not throw' : function(err, obj) {
        assert.isNull(err);
      },
      'should parse request' : function(err, obj) {
        assert.equal(obj.clientID, 'c123');
        assert.equal(obj.redirectURI, 'http://example.com/auth/callback');
        assert.isArray(obj.scope);
        assert.lengthOf(obj.scope, 2);
        assert.equal(obj.scope[0], 'read');
        assert.equal(obj.scope[1], 'write');
        assert.equal(obj.state, 'f1o1o1');
      },
    },
  },
  
  // OK
  'request parsing function that receives a request with missing client_id parameter': {
    topic: function() {
      return code(function() {});
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        req.query = { redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1'
        };

        process.nextTick(function () {
          try {
            var obj = code.request(req);
            self.callback(null, obj);
          } catch (e) {
            self.callback(e);
          }
        });
      },

      'should throw' : function(err, obj) {
        assert.instanceOf(err, Error);
        assert.equal(err.constructor.name, 'AuthorizationError');
        assert.equal(err.code, 'invalid_request');
        //assert.equal(err.message, 'missing client_id parameter');
      },
    },
  },
  
  // OK
  'response handling function that processes a decision': {
    topic: function() {
      return code(function(client, redirectURI, user, done) {
        if (client.id == 'c123' && redirectURI == 'http://example.com/auth/other/callback' && user.id == 'u123') {
          return done(null, 'xyz');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }
        
        var txn = {};
        txn.client = { id: 'c123', name: 'Example' };
        txn.redirectURI = 'http://example.com/auth/callback';
        txn.req = {
          redirectURI: 'http://example.com/auth/other/callback'
        }
        txn.user = { id: 'u123', name: 'Bob' };
        txn.res = { allow: true }
        
        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          code.response(txn, res, next)
        });
      },

      'should not throw' : function(err, req, res) {
        assert.isNull(err);
      },
      'should parse request' : function(err, req, res) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?code=xyz');
      },
    },
  },
  
  // OK
  'response handling function that processes a decision with state': {
    topic: function() {
      return code(function(client, redirectURI, user, done) {
        if (client.id == 'c123' && redirectURI == 'http://example.com/auth/other/callback' && user.id == 'u123') {
          return done(null, 'xyz');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }
        
        var txn = {};
        txn.client = { id: 'c123', name: 'Example' };
        txn.redirectURI = 'http://example.com/auth/callback';
        txn.req = {
          redirectURI: 'http://example.com/auth/other/callback',
          state: 'f1o1o1'
        }
        txn.user = { id: 'u123', name: 'Bob' };
        txn.res = { allow: true }
        
        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          code.response(txn, res, next)
        });
      },

      'should not throw' : function(err, req, res) {
        assert.isNull(err);
      },
      'should parse request' : function(err, req, res) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?code=xyz&state=f1o1o1');
      },
    },
  },
  
  // OK
  'response handling function that processes a decision using user response': {
    topic: function() {
      return code(function(client, redirectURI, user, ares, done) {
        if (client.id == 'c123' && redirectURI == 'http://example.com/auth/other/callback' && user.id == 'u123' && ares.scope == 'foo') {
          return done(null, 'xyz');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }
        
        var txn = {};
        txn.client = { id: 'c123', name: 'Example' };
        txn.redirectURI = 'http://example.com/auth/callback';
        txn.req = {
          redirectURI: 'http://example.com/auth/other/callback'
        }
        txn.user = { id: 'u123', name: 'Bob' };
        txn.res = { allow: true, scope: 'foo' };
        
        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          code.response(txn, res, next)
        });
      },

      'should not throw' : function(err, req, res) {
        assert.isNull(err);
      },
      'should parse request' : function(err, req, res) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?code=xyz');
      },
    },
  },
  
  // OK
  'response handling function that processes a decision to disallow': {
    topic: function() {
      return code(function(client, redirectURI, user, done) {
        return done(new Error('should not be called'));
      });
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }
        
        var txn = {};
        txn.client = { id: 'c123', name: 'Example' };
        txn.redirectURI = 'http://example.com/auth/callback';
        txn.req = {
          redirectURI: 'http://example.com/auth/other/callback'
        }
        txn.user = { id: 'u123', name: 'Bob' };
        txn.res = { allow: false }
        
        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          code.response(txn, res, next)
        });
      },

      'should not throw' : function(err, req, res) {
        assert.isNull(err);
      },
      'should parse request' : function(err, req, res) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?error=access_denied');
      },
    },
  },
  
  // OK
  'response handling function that processes a decision to disallow with state': {
    topic: function() {
      return code(function(client, redirectURI, user, done) {
        return done(new Error('should not be called'));
      });
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }
        
        var txn = {};
        txn.client = { id: 'c123', name: 'Example' };
        txn.redirectURI = 'http://example.com/auth/callback';
        txn.req = {
          redirectURI: 'http://example.com/auth/other/callback',
          state: 'f2o2o2'
        }
        txn.user = { id: 'u123', name: 'Bob' };
        txn.res = { allow: false }
        
        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          code.response(txn, res, next)
        });
      },

      'should not throw' : function(err, req, res) {
        assert.isNull(err);
      },
      'should parse request' : function(err, req, res) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?error=access_denied&state=f2o2o2');
      },
    },
  },
  
  // OK
  'response handling function that does not issue a code': {
    topic: function() {
      return code(function(client, redirectURI, user, done) {
        return done(null, false);
      });
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }
        
        var txn = {};
        txn.client = { id: 'c123', name: 'Example' };
        txn.redirectURI = 'http://example.com/auth/callback';
        txn.req = {
          redirectURI: 'http://example.com/auth/other/callback'
        }
        txn.user = { id: 'u123', name: 'Bob' };
        txn.res = { allow: true }
        
        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          code.response(txn, res, next)
        });
      },

      'should not respond' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError')
        assert.equal(e.code, 'access_denied')
        //assert.equal(e.message, 'authorization server denied request')
      },
      'should not parse request' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
    },
  },
  
  // OK
  'response handling function that errors while processing a decision': {
    topic: function() {
      return code(function(client, redirectURI, user, done) {
        return done(new Error('something went wrong'))
      });
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }
        
        var txn = {};
        txn.client = { id: 'c123', name: 'Example' };
        txn.redirectURI = 'http://example.com/auth/callback';
        txn.req = {
          redirectURI: 'http://example.com/auth/other/callback'
        }
        txn.user = { id: 'u123', name: 'Bob' };
        txn.res = { allow: true }
        
        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          code.response(txn, res, next)
        });
      },

      'should not respond' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
      },
      'should not parse request' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
    },
  },
  
  'response handling function processes a transaction witout redirect URI': {
    topic: function() {
      return code(function(client, redirectURI, user, done) {
        return done(null, 'xyz');
      });
    },
    
    'when handling a request': {
      topic: function(code) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }
        
        var txn = {};
        txn.client = { id: 'c123', name: 'Example' };
        txn.req = {
          redirectURI: 'http://example.com/auth/other/callback'
        }
        txn.user = { id: 'u123', name: 'Bob' };
        txn.res = { allow: true }
        
        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          code.response(txn, res, next)
        });
      },

      'should not respond' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        //assert.equal(e.message, 'No redirect URI available to send OAuth 2.0 response.');
      },
      'should not parse request' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
    },
  },
  
  // OK
  'middleware constructed without an issue function': {
    'should throw an error': function () {
      assert.throws(function() { code() });
    },
  },

}).export(module);
