var vows = require('vows');
var assert = require('assert');
var util = require('util');
var refreshToken = require('exchange/refreshToken');


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

vows.describe('refreshToken').addBatch({

  'middleware': {
    topic: function() {
      return refreshToken(function() {});
    },
    
    'should return a function named refresh_token' : function(fn) {
      assert.isFunction(fn);
      assert.equal(fn.name, 'refresh_token');
    },
  },
  
  'middleware that issues an access token': {
    topic: function() {
      return refreshToken(function(client, refreshToken, done) {
        if (client.id == 'c123' && refreshToken == 'refreshing') {
          done(null, 's3cr1t')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
      return refreshToken(function(client, refreshToken, done) {
        if (client.id == 'c123' && refreshToken == 'refreshing') {
          done(null, 's3cr1t', 'getANotehr')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
      return refreshToken(function(client, refreshToken, done) {
        if (client.id == 'c123' && refreshToken == 'refreshing') {
          done(null, 's3cr1t', null, { 'expires_in': 3600 })
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
      return refreshToken(function(client, refreshToken, done) {
        if (client.id == 'c123' && refreshToken == 'refreshing') {
          done(null, 's3cr1t', 'blahblag', { 'token_type': 'foo', 'expires_in': 3600 })
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
  
  'middleware that issues an access token based on scope': {
    topic: function() {
      return refreshToken(function(client, refreshToken, scope, done) {
        if (client.id == 'c123' && refreshToken == 'refreshing' &&
            scope.length == 1 && scope[0] == 'read') {
          done(null, 's3cr1t')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing', scope: 'read' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
  
  'middleware that issues an access token based on list of scopes': {
    topic: function() {
      return refreshToken(function(client, refreshToken, scope, done) {
        if (client.id == 'c123' && refreshToken == 'refreshing' &&
            scope.length == 2 && scope[0] == 'read' && scope[1] == 'write') {
          done(null, 's3cr1t')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing', scope: 'read write' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
  
  'middleware using scope separator that issues an access token based on list of scopes': {
    topic: function() {
      return refreshToken({ scopeSeparator: ',' }, function(client, refreshToken, scope, done) {
        if (client.id == 'c123' && refreshToken == 'refreshing' &&
            scope.length == 2 && scope[0] == 'read' && scope[1] == 'write') {
          done(null, 's3cr1t')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing', scope: 'read,write' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
  
  'middleware using multiple scope separators that issues an access token based on list of scopes': {
    topic: function() {
      return refreshToken({ scopeSeparator: [' ', ','] }, function(client, refreshToken, scope, done) {
        if (client.id == 'c123' && refreshToken == 'refreshing' &&
            scope.length == 2 && scope[0] == 'read' && scope[1] == 'write') {
          done(null, 's3cr1t')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request with space separator': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing', scope: 'read write' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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

    'when handling a request with comma separator': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing', scope: 'read,write' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
  
  'middleware with userProperty option that issues an access token': {
    topic: function() {
      return refreshToken({ userProperty: 'otheruser' }, function(client, refreshToken, done) {
        if (client.id == 'c123' && refreshToken == 'refreshing') {
          done(null, 's3cr1t')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.otheruser = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
      return refreshToken(function(client, refreshToken, done) {
        return done(null, false);
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError')
        assert.equal(e.code, 'invalid_grant')
        assert.equal(e.message, 'invalid refresh token')
      },
    },
  },
  
  'middleware that errors while issuing an access token': {
    topic: function() {
      return refreshToken(function(client, refreshToken, done) {
        return done(new Error('something went wrong'));
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { refresh_token: 'refreshing' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
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
  
  'middleware that handles a request lacking a refresh token': {
    topic: function() {
      return refreshToken(function(client, refreshToken, done) {
        return done(new Error('something went wrong'));
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          refreshToken(req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.code, 'invalid_request');
        assert.equal(e.message, 'missing refresh_token parameter');
      },
    },
  },
  
  'middleware that handles a request in which the body was not parsed': {
    topic: function() {
      return refreshToken(function(client, refreshToken, done) {
        return done(new Error('something went wrong'));
      });
    },

    'when handling a request': {
      topic: function(refreshToken) {
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
          refreshToken(req, res, next)
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
      assert.throws(function() { refreshToken() });
    },
  },

}).export(module);
