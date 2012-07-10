var vows = require('vows');
var assert = require('assert');
var util = require('util');
var password = require('exchange/password');


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

vows.describe('password').addBatch({

  'middleware': {
    topic: function() {
      return password(function() {});
    },
    
    'should return a function named password' : function(fn) {
      assert.isFunction(fn);
      assert.equal(fn.name, 'password');
    },
  },
  
  'middleware that issues an access token': {
    topic: function() {
      return password(function(client, username, passwd, done) {
        if (client.id == 'c123' && username == 'bob' && passwd == 'shh') {
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
        req.body = { username: 'bob', password: 'shh' };
        
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
      return password(function(client, username, passwd, done) {
        if (client.id == 'c123' && username == 'bob' && passwd == 'shh') {
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
        req.body = { username: 'bob', password: 'shh' };
        
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
      return password(function(client, username, passwd, done) {
        if (client.id == 'c123' && username == 'bob' && passwd == 'shh') {
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
        req.body = { username: 'bob', password: 'shh' };
        
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
      return password(function(client, username, passwd, done) {
        if (client.id == 'c123' && username == 'bob' && passwd == 'shh') {
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
        req.body = { username: 'bob', password: 'shh' };
        
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
  
  'middleware that issues an access token based on scope': {
    topic: function() {
      return password(function(client, username, passwd, scope, done) {
        if (client.id == 'c123' && username == 'bob' && passwd == 'shh' &&
            scope.length == 1 && scope[0] == 'read') {
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
        req.body = { username: 'bob', password: 'shh', scope: 'read' };
        
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
  
  'middleware that issues an access token based on list of scopes': {
    topic: function() {
      return password(function(client, username, passwd, scope, done) {
        if (client.id == 'c123' && username == 'bob' && passwd == 'shh' &&
            scope.length == 2 && scope[0] == 'read' && scope[1] == 'write') {
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
        req.body = { username: 'bob', password: 'shh', scope: 'read write' };
        
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
  
  'middleware using scope separator that issues an access token based on list of scopes': {
    topic: function() {
      return password({ scopeSeparator: ',' }, function(client, username, passwd, scope, done) {
        if (client.id == 'c123' && username == 'bob' && passwd == 'shh' &&
            scope.length == 2 && scope[0] == 'read' && scope[1] == 'write') {
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
        req.body = { username: 'bob', password: 'shh', scope: 'read,write' };
        
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
  
  'middleware using multiple scope separators that issues an access token based on list of scopes': {
    topic: function() {
      return password({ scopeSeparator: [' ', ','] }, function(client, username, passwd, scope, done) {
        if (client.id == 'c123' && username == 'bob' && passwd == 'shh' &&
            scope.length == 2 && scope[0] == 'read' && scope[1] == 'write') {
          done(null, 's3cr1t')
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request with space scope separator': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { username: 'bob', password: 'shh', scope: 'read write' };
        
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
    
    'when handling a request with comma scope separator': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { username: 'bob', password: 'shh', scope: 'read,write' };
        
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
  
  'middleware with userProperty option that issues an access token': {
    topic: function() {
      return password({ userProperty: 'otheruser' }, function(client, username, passwd, done) {
        if (client.id == 'c123' && username == 'bob' && passwd == 'shh') {
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
        req.body = { username: 'bob', password: 'shh' };
        
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
      return password(function(client, username, passwd, done) {
        done(null, false)
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.otheruser = { id: 'c123', name: 'Example' };
        req.body = { username: 'bob', password: 'shh' };
        
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
        assert.equal(e.message, 'invalid resource owner credentials')
      },
    },
  },
  
  'middleware that errors while issuing an access token': {
    topic: function() {
      return password(function(client, username, passwd, done) {
        done(new Error('something went wrong'))
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.otheruser = { id: 'c123', name: 'Example' };
        req.body = { username: 'bob', password: 'shh' };
        
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
  
  'middleware that handles a request lacking a username': {
    topic: function() {
      return password(function(client, username, passwd, done) {
        done(null, 's3cr1t')
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.otheruser = { id: 'c123', name: 'Example' };
        req.body = { password: 'shh' };
        
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
        assert.equal(e.message, 'missing username parameter');
      },
    },
  },
  
  'middleware that handles a request lacking a password': {
    topic: function() {
      return password(function(client, username, passwd, done) {
        done(null, 's3cr1t')
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.otheruser = { id: 'c123', name: 'Example' };
        req.body = { username: 'bob' };
        
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
        assert.equal(e.message, 'missing password parameter');
      },
    },
  },
  
  'middleware that handles a request in which body was not parsed': {
    topic: function() {
      return password(function(client, username, passwd, done) {
        done(null, 's3cr1t')
      });
    },

    'when handling a request': {
      topic: function(authorizationCode) {
        var self = this;
        var req = new MockRequest();
        req.otheruser = { id: 'c123', name: 'Example' };
        
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
      assert.throws(function() { password() });
    },
  },

}).export(module);
