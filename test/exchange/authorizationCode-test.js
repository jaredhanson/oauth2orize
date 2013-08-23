var vows = require('vows');
var assert = require('assert');
var util = require('util');
var authorizationCode = require('../../lib/exchange/authorizationCode');


function MockRequest() {
}

function MockResponse() {
  this._headers = {};
  this._data = '';
}

MockResponse.prototype.setHeader = function(name, value) {
  this._headers[name] = value;
}

MockResponse.prototype.end = function(data, encoding) {
  this._data += data;
  if (this.done) { this.done(); }
}

vows.describe('authorizationCode').addBatch({
  
  'middleware': {
    topic: function() {
      return authorizationCode(function() {});
    },
    
    'should return a function named authorization_code' : function(fn) {
      assert.isFunction(fn);
      assert.equal(fn.name, 'authorization_code');
    },
  },
  
  'middleware that issues an access token': {
    topic: function() {
      return authorizationCode(function(client, code, redirectURI, done) {
        if (client.id == 'c123' && code == 'abc123' && redirectURI == 'http://example.com/oa/callback') {
          done(null, 's3cr1t')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          authorizationCode(req, res, next)
        });
      },

      'should not call next' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res._headers['Content-Type'], 'application/json');
        assert.equal(res._headers['Cache-Control'], 'no-store');
        assert.equal(res._headers['Pragma'], 'no-cache');
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, '{"access_token":"s3cr1t","token_type":"bearer"}');
      },
    },
  },
  
  'middleware that issues an access token and refresh token': {
    topic: function() {
      return authorizationCode(function(client, code, redirectURI, done) {
        if (client.id == 'c123' && code == 'abc123' && redirectURI == 'http://example.com/oa/callback') {
          done(null, 's3cr1t', 'getANotehr')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          authorizationCode(req, res, next)
        });
      },

      'should not call next' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res._headers['Content-Type'], 'application/json');
        assert.equal(res._headers['Cache-Control'], 'no-store');
        assert.equal(res._headers['Pragma'], 'no-cache');
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, '{"access_token":"s3cr1t","refresh_token":"getANotehr","token_type":"bearer"}');
      },
    },
  },
  
  'middleware that issues an access token, null refresh token, and params': {
    topic: function() {
      return authorizationCode(function(client, code, redirectURI, done) {
        if (client.id == 'c123' && code == 'abc123' && redirectURI == 'http://example.com/oa/callback') {
          done(null, 's3cr1t', null, { 'expires_in': 3600 })
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          authorizationCode(req, res, next)
        });
      },

      'should not call next' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res._headers['Content-Type'], 'application/json');
        assert.equal(res._headers['Cache-Control'], 'no-store');
        assert.equal(res._headers['Pragma'], 'no-cache');
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, '{"access_token":"s3cr1t","expires_in":3600,"token_type":"bearer"}');
      },
    },
  },
  
  'middleware that issues an access token, refresh token, and params with token_type': {
    topic: function() {
      return authorizationCode(function(client, code, redirectURI, done) {
        if (client.id == 'c123' && code == 'abc123' && redirectURI == 'http://example.com/oa/callback') {
          done(null, 's3cr1t', 'blahblag', { 'token_type': 'foo', 'expires_in': 3600 })
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          authorizationCode(req, res, next)
        });
      },

      'should not call next' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res._headers['Content-Type'], 'application/json');
        assert.equal(res._headers['Cache-Control'], 'no-store');
        assert.equal(res._headers['Pragma'], 'no-cache');
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, '{"access_token":"s3cr1t","refresh_token":"blahblag","token_type":"foo","expires_in":3600}');
      },
    },
  },
  
  'middleware with userProperty option that issues an access token': {
    topic: function() {
      return authorizationCode({ userProperty: 'otheruser' }, function(client, code, redirectURI, done) {
        if (client.id == 'c123' && code == 'abc123' && redirectURI == 'http://example.com/oa/callback') {
          done(null, 's3cr1t')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.otheruser = { id: 'c123', name: 'Example' };
        req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          authorizationCode(req, res, next)
        });
      },

      'should not call next' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res._headers['Content-Type'], 'application/json');
        assert.equal(res._headers['Cache-Control'], 'no-store');
        assert.equal(res._headers['Pragma'], 'no-cache');
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, '{"access_token":"s3cr1t","token_type":"bearer"}');
      },
    },
  },
  
  'middleware that does not issue an access token': {
    topic: function() {
      return authorizationCode(function(client, code, redirectURI, done) {
        done(null, false)
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorizationCode(req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError')
        assert.equal(e.code, 'invalid_grant')
        assert.equal(e.message, 'invalid code')
      },
    },
  },
  
  'middleware that errors while issuing an access token': {
    topic: function() {
      return authorizationCode(function(client, code, redirectURI, done) {
        done(new Error('something went wrong'))
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorizationCode(req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      },
    },
  },
  
  'middleware that handles a request lacking an authorization code': {
    topic: function() {
      return authorizationCode(function(client, code, redirectURI, done) {
        done(null, 's3cr1t')
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { xcode: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorizationCode(req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.code, 'invalid_request');
        assert.equal(e.message, 'missing code parameter');
      },
    },
  },
  
  'middleware that handles a request in which body was not parsed': {
    topic: function() {
      return authorizationCode(function(client, code, redirectURI, done) {
        done(null, 's3cr1t')
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorizationCode(req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'Request body not parsed. Use bodyParser middleware.');
      },
    },
  },
  
  'middleware constructed without an issue function': {
    'should throw an error': function () {
      assert.throws(function() { authorizationCode() });
    },
  },

}).export(module);
