var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var errorHandler = require('../../lib/middleware/errorHandler');
var Server = require('../../lib/server');
var AuthorizationError = require('../../lib/errors/authorizationerror');


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


vows.describe('errorHandler').addBatch({

  'middleware that handles an error in direct mode': {
    topic: function() {
      return errorHandler();
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res.statusCode, 500);
        assert.isUndefined(res._headers['WWW-Authenticate']);
        assert.equal(res._headers['Content-Type'], 'application/json');
      },
      'should send response' : function(err, req, res, e) {
        assert.equal(res._data, '{"error":"server_error","error_description":"something went wrong"}');
      },
    },
  },
  
  'middleware that handles an authorization error in direct mode': {
    topic: function() {
      return errorHandler();
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new AuthorizationError('something went wrong', 'invalid_request');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res.statusCode, 400);
        assert.isUndefined(res._headers['WWW-Authenticate']);
        assert.equal(res._headers['Content-Type'], 'application/json');
      },
      'should send response' : function(err, req, res, e) {
        assert.equal(res._data, '{"error":"invalid_request","error_description":"something went wrong"}');
      },
    },
  },
  
  'middleware that handles an authorization error with uri in direct mode': {
    topic: function() {
      return errorHandler();
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new AuthorizationError('something went wrong', 'invalid_request', 'http://example.com/errors/1');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should set headers' : function(err, req, res) {
        assert.equal(res.statusCode, 400);
        assert.isUndefined(res._headers['WWW-Authenticate']);
        assert.equal(res._headers['Content-Type'], 'application/json');
      },
      'should send response' : function(err, req, res, e) {
        assert.equal(res._data, '{"error":"invalid_request","error_description":"something went wrong","error_uri":"http://example.com/errors/1"}');
      },
    },
  },
  
  'middleware that handles an error in indirect mode': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should redirect to redirectURI' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?error=server_error&error_description=something%20went%20wrong');
      },
    },
  },
  
  'middleware that handles an authorization error in indirect mode': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new AuthorizationError('not authorized', 'unauthorized_client');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should redirect to redirectURI' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized');
      },
    },
  },
  
  'middleware that handles an authorization error with uri in indirect mode': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          var e = new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2');
          errorHandler(e, req, res, next)
        });
      },

      'should not invoke next' : function(err, req, res) {
        assert.isNull(err);
      },
      'should redirect to redirectURI' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized&error_uri=http%3A%2F%2Fexample.com%2Ferrors%2F2');
      },
    },
  },
  
  'middleware that handles an error in indirect mode without an oauth transaction': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should pass error to next middleware' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      },
    },
  },
  
  'middleware that handles an error in indirect mode without a redirect URI': {
    topic: function() {
      return errorHandler({ mode: 'indirect' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth2 = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should pass error to next middleware' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      },
    },
  },
  
  'middleware that handles an error in unknown mode': {
    topic: function() {
      return errorHandler({ mode: 'unknown' });
    },

    'when handling an error': {
      topic: function(errorHandler) {
        var self = this;
        var req = new MockRequest();
        req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          var e = new Error('something went wrong');
          errorHandler(e, req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should pass error to next middleware' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      },
    },
  },

}).export(module);
