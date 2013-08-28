var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var decision = require('../../lib/middleware/decision');
var Server = require('../../lib/server');


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


vows.describe('decision').addBatch({
  
  // OK
  'middleware that handles a user decision to allow': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        if (txn.transactionID == 'abc123') {
          res.redirect(txn.redirectURI + '?code=a1b1c1')
        } else {
          return next(new Error('something is wrong'));
        }
      });
      
      return decision(server);
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.user);
        assert.equal(req.oauth2.user.id, 'u1234');
        assert.equal(req.oauth2.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.res);
        assert.isTrue(req.oauth2.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?code=a1b1c1');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware that handles a user decision to disallow': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        if (txn.transactionID == 'abc123' && txn.res.allow == false) {
          res.redirect(txn.redirectURI + '?error=access_denied')
        } else {
          return next(new Error('something is wrong'));
        }
      });
      
      return decision(server);
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.body = { cancel: 'Deny' };
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.user);
        assert.equal(req.oauth2.user.id, 'u1234');
        assert.equal(req.oauth2.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.res);
        assert.isFalse(req.oauth2.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?error=access_denied');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware that parses and handles a user decision to allow': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        if (txn.transactionID == 'abc123' && txn.res.scope == 'no-email') {
          res.redirect(txn.redirectURI + '?code=a1b1c1')
        } else {
          return next(new Error('something is wrong'));
        }
      });
      
      return decision(server, function(req, done) {
        done(null, { scope: req.query.scope });
      });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.query.scope = 'no-email';
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.user);
        assert.equal(req.oauth2.user.id, 'u1234');
        assert.equal(req.oauth2.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.res);
        assert.isTrue(req.oauth2.res.allow);
        assert.equal(req.oauth2.res.scope, 'no-email');
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?code=a1b1c1');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware that parses and handles a user decision to disallow': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        if (txn.transactionID == 'abc123' && txn.res.allow == false) {
          res.redirect(txn.redirectURI + '?error=access_denied')
        } else {
          return next(new Error('something is wrong'));
        }
      });
      
      return decision(server, function(req, done) {
        done(null, { allow: false });
      });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.query.scope = 'no-email';
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.user);
        assert.equal(req.oauth2.user.id, 'u1234');
        assert.equal(req.oauth2.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.res);
        assert.isFalse(req.oauth2.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?error=access_denied');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware with userProperty option that handles a user decision to allow': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.redirect(txn.redirectURI + '?code=a1b1c1')
      });
      
      return decision(server, { userProperty: 'otheruser' });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.otheruser = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.user);
        assert.equal(req.oauth2.user.id, 'u1234');
        assert.equal(req.oauth2.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.res);
        assert.isTrue(req.oauth2.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?code=a1b1c1');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware with sessionKey option that handles a user decision to allow': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.redirect(txn.redirectURI + '?code=a1b1c1')
      });
      
      return decision(server, { sessionKey: 'oauth2orize' });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['oauth2orize'] = {};
        req.session['oauth2orize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.user);
        assert.equal(req.oauth2.user.id, 'u1234');
        assert.equal(req.oauth2.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.res);
        assert.isTrue(req.oauth2.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?code=a1b1c1');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['oauth2orize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware with cancelField that handles a user decision to disallow': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        if (txn.transactionID == 'abc123' && txn.res.allow == false) {
          res.redirect(txn.redirectURI + '?error=access_denied')
        } else {
          return next(new Error('something is wrong'));
        }
      });
      
      return decision(server, { cancelField: 'deny' });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.body = { deny: 'Deny' };
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.user);
        assert.equal(req.oauth2.user.id, 'u1234');
        assert.equal(req.oauth2.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.res);
        assert.isFalse(req.oauth2.res.allow);
      },
      'should redirect to callbackURL' : function(err, req, res, e) {
        assert.equal(res._redirect, 'http://example.com/auth/callback?error=access_denied');
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware that handles a user decision to allow but of unkown type': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.redirect(txn.redirectURI + '?code=a1b1c1')
      });
      
      return decision(server);
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'foo', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        assert.equal(res._error.constructor.name, 'AuthorizationError');
        assert.equal(res._error.code, 'unsupported_response_type');
        //assert.equal(res._error.message, 'invalid response type');
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.user);
        assert.equal(req.oauth2.user.id, 'u1234');
        assert.equal(req.oauth2.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.res);
        assert.isTrue(req.oauth2.res.allow);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware that errors while responding with grant': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        next(new Error('something went wrong'))
      });
      
      return decision(server);
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        assert.equal(res._error.message, 'something went wrong');
      },
      'should set user on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.user);
        assert.equal(req.oauth2.user.id, 'u1234');
        assert.equal(req.oauth2.user.username, 'bob');
      },
      'should set res on oauth transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2.res);
        assert.isTrue(req.oauth2.res.allow);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware that errors while parsing': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.redirect(txn.redirectURI + '?code=a1b1c1')
      });
      
      return decision(server, function(req, done) {
        done(new Error('something went wrong'))
      });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.query.scope = 'no-email';
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        assert.equal(res._error.message, 'something went wrong');
      },
      'should not set user on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2.user);
      },
      'should not set res on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2.res);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should not remove transaction from session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware that handles a request without a session': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.redirect(txn.redirectURI + '?code=a1b1c1')
      });
      
      return decision(server, function(req, done) {
        done(new Error('something went wrong'))
      });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.query.scope = 'no-email';
        req.body = {};
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        //assert.equal(res._error.message, 'OAuth 2.0 server requires session support.');
      },
      'should not set user on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2.user);
      },
      'should not set res on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2.res);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
    },
  },
  
  // OK
  'middleware that handles a request without authorization transactions in the session': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.redirect(txn.redirectURI + '?code=a1b1c1')
      });
      
      return decision(server, function(req, done) {
        done(new Error('something went wrong'))
      });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.query.scope = 'no-email';
        req.body = {};
        req.session = {};
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        //assert.equal(res._error.message, 'Invalid OAuth 2.0 session key.');
      },
      'should not set user on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2.user);
      },
      'should not set res on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2.res);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
    },
  },
  
  // OK
  'middleware that handles a request without a body': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.redirect(txn.redirectURI + '?code=a1b1c1')
      });
      
      return decision(server, function(req, done) {
        done(new Error('something went wrong'))
      });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.query.scope = 'no-email';
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        req.oauth2 = {};
        req.oauth2.transactionID = 'abc123';
        req.oauth2.client = { id: 'c5678', name: 'Example' };
        req.oauth2.redirectURI = 'http://example.com/auth/callback';
        req.oauth2.req = { type: 'code', scope: 'email' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        //assert.equal(res._error.message, 'OAuth 2.0 server requires body parsing.');
      },
      'should not set user on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2.user);
      },
      'should not set res on oauth transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2.res);
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should not remove transaction from session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['abc123']);
      },
    },
  },
  
  // OK
  'middleware that handles a request without a transaction': {
    topic: function() {
      var server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        res.redirect(txn.redirectURI + '?code=a1b1c1')
      });
      
      return decision(server, function(req, done) {
        done(new Error('something went wrong'))
      });
    },

    'when handling a request': {
      topic: function(decision) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.query.scope = 'no-email';
        req.body = {};
        req.session = {};
        req.session['authorize'] = {};
        req.session['authorize']['abc123'] = { protocol: 'oauth2' };
        req.user = { id: 'u1234', username: 'bob' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          res._error = err;
          res.end();
        }
        process.nextTick(function () {
          decision(req, res, next);
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(res._error, Error);
        //assert.equal(res._error.message, 'OAuth 2.0 transaction not found.');
      },
      'should not redirect to callbackURL' : function(err, req, res, e) {
        assert.isUndefined(res._redirect);
      },
      'should not remove transaction from session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['abc123']);
      },
    },
  },
  
  'middleware constructed without a server instance': {
    'should throw an error': function () {
      assert.throws(function() { decision() });
    },
  },

}).export(module);
