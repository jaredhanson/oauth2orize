var vows = require('vows');
var assert = require('assert');
var util = require('util');
var token = require('../../lib/grant/token');


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
  
  'middleware': {
    topic: function() {
      return token(function() {});
    },
    
    'should return a module named code' : function(mod) {
      assert.equal(mod.name, 'token');
    },
    'should return a module with request and response functions' : function(mod) {
      assert.isFunction(mod.request);
      assert.isFunction(mod.response);
    },
  },
  
  'request parsing function that receives a request': {
    topic: function() {
      return token(function() {});
    },
    
    'when handling a request': {
      topic: function(token) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1'
        };

        process.nextTick(function () {
          try {
            var obj = token.request(req);
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
  
  'request parsing function that receives a request with scope': {
    topic: function() {
      return token(function() {});
    },
    
    'when handling a request': {
      topic: function(token) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read'
        };

        process.nextTick(function () {
          try {
            var obj = token.request(req);
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
  
  'request parsing function that receives a request with list of scopes': {
    topic: function() {
      return token(function() {});
    },
    
    'when handling a request': {
      topic: function(token) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read write'
        };

        process.nextTick(function () {
          try {
            var obj = token.request(req);
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
  
  'request parsing function using scope separator that receives a request with list of scopes': {
    topic: function() {
      return token({ scopeSeparator: ',' }, function() {});
    },
    
    'when handling a request': {
      topic: function(token) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read,write'
        };

        process.nextTick(function () {
          try {
            var obj = token.request(req);
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
  
  'request parsing function using multiple scope separators that receives a request with list of scopes': {
    topic: function() {
      return token({ scopeSeparator: [' ', ','] }, function() {});
    },
    
    'when handling a request with space scope separator': {
      topic: function(token) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read write'
        };

        process.nextTick(function () {
          try {
            var obj = token.request(req);
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
      topic: function(token) {
        var self = this;
        var req = new MockRequest();
        req.query = { client_id: 'c123',
          redirect_uri: 'http://example.com/auth/callback',
          state: 'f1o1o1',
          scope: 'read,write'
        };

        process.nextTick(function () {
          try {
            var obj = token.request(req);
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
  
  'request parsing function that receives a request with missing client_id parameter': {
    topic: function() {
      return token(function() {});
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
        assert.equal(err.message, 'missing client_id parameter');
      },
    },
  },

  'response handling function that processes a decision': {
    topic: function() {
      return token(function(client, user, done) {
        if (client.id == 'c123' && user.id == 'u123') {
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
          redirectURI: 'http://example.com/auth/callback'
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
        assert.equal(res._redirect, 'http://example.com/auth/callback#access_token=xyz&token_type=bearer');
      },
    },
  },
  
  'response handling function that processes a decision with state': {
    topic: function() {
      return token(function(client, user, done) {
        if (client.id == 'c123' && user.id == 'u123') {
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
          redirectURI: 'http://example.com/auth/callback',
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
        assert.equal(res._redirect, 'http://example.com/auth/callback#access_token=xyz&token_type=bearer&state=f1o1o1');
      },
    },
  },
  
  'response handling function that processes a decision using user response': {
    topic: function() {
      return token(function(client, user, ares, done) {
        if (client.id == 'c123' && user.id == 'u123' && ares.scope == 'foo') {
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
          redirectURI: 'http://example.com/auth/callback'
        }
        txn.user = { id: 'u123', name: 'Bob' };
        txn.res = { allow: true, scope: 'foo' }
        
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
        assert.equal(res._redirect, 'http://example.com/auth/callback#access_token=xyz&token_type=bearer');
      },
    },
  },
  
  'response handling function that processes a decision and adds params to response': {
    topic: function() {
      return token(function(client, user, done) {
        return done(null, 'xyz', { 'expires_in': 3600 });
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
          redirectURI: 'http://example.com/auth/callback'
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
        assert.equal(res._redirect, 'http://example.com/auth/callback#access_token=xyz&expires_in=3600&token_type=bearer');
      },
    },
  },
  
  'response handling function that processes a decision and adds params including token_type to response': {
    topic: function() {
      return token(function(client, user, done) {
        return done(null, 'xyz', { 'token_type': 'foo', 'expires_in': 3600 });
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
          redirectURI: 'http://example.com/auth/callback'
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
        assert.equal(res._redirect, 'http://example.com/auth/callback#access_token=xyz&token_type=foo&expires_in=3600');
      },
    },
  },
  
  'response handling function that processes a decision to disallow': {
    topic: function() {
      return token(function(client, user, done) {
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
          redirectURI: 'http://example.com/auth/callback'
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
        assert.equal(res._redirect, 'http://example.com/auth/callback#error=access_denied');
      },
    },
  },
  
  'response handling function that processes a decision to disallow with state': {
    topic: function() {
      return token(function(client, user, done) {
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
          redirectURI: 'http://example.com/auth/callback',
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
        assert.equal(res._redirect, 'http://example.com/auth/callback#error=access_denied&state=f2o2o2');
      },
    },
  },
  
  'response handling function that does not issue a token': {
    topic: function() {
      return token(function(client, user, done) {
        return done(null, false)
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
          redirectURI: 'http://example.com/auth/callback'
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
        assert.equal(e.message, 'authorization server denied request')
      },
      'should not parse request' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
    },
  },
  
  'response handling function that errors while processing a decision': {
    topic: function() {
      return token(function(client, user, done) {
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
          redirectURI: 'http://example.com/auth/callback'
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
  
  'response handling function that processes a transaction without redirect URI': {
    topic: function() {
      return token(function(client, user, done) {
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
          redirectURI: 'http://example.com/auth/callback'
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
        assert.equal(e.message, 'No redirect URI available to send OAuth 2.0 response.');
      },
      'should not parse request' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
    },
  },
  
  'middleware constructed without an issue function': {
    'should throw an error': function () {
      assert.throws(function() { token() });
    },
  },

}).export(module);
