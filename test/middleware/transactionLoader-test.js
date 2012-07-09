var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var transactionLoader = require('middleware/transactionLoader');
var Server = require('server');


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


vows.describe('transactionLoader').addBatch({

  'middleware that loads a transaction based on ID in query': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(null, { id: id, name: 'Example' })
      });
      
      return transactionLoader(server);
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.query = { 'transaction_id': '1234' }
        req.session = {};
        req.session.authorize = {};
        req.session.authorize['1234'] = {
          client: '1',
          redirectURI: 'http://www.example.com/auth/callback',
          req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
        }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should restore transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.equal(req.oauth2.transactionID, '1234');
        assert.equal(req.oauth2.client.id, '1');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://www.example.com/auth/callback');
        assert.equal(req.oauth2.req.redirectURI, 'http://www.example.com/auth/callback');
        assert.equal(req.oauth2.req.foo, 'bar');
      },
      'should leave transaction in session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['1234']);
      },
    },
  },
  
  'middleware that loads a transaction based on ID in body': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(null, { id: id, name: 'Example' })
      });
      
      return transactionLoader(server);
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.body = { 'transaction_id': '1234' }
        req.session = {};
        req.session.authorize = {};
        req.session.authorize['1234'] = {
          client: '1',
          redirectURI: 'http://www.example.com/auth/callback',
          req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
        }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should restore transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.equal(req.oauth2.transactionID, '1234');
        assert.equal(req.oauth2.client.id, '1');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://www.example.com/auth/callback');
        assert.equal(req.oauth2.req.redirectURI, 'http://www.example.com/auth/callback');
        assert.equal(req.oauth2.req.foo, 'bar');
      },
      'should leave transaction in session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['1234']);
      },
    },
  },
  
  'middleware with transactionField option that loads a transaction': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(null, { id: id, name: 'Example' })
      });
      
      return transactionLoader(server, { transactionField: 'txn_id' });
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.body = { 'txn_id': '1234' }
        req.session = {};
        req.session.authorize = {};
        req.session.authorize['1234'] = {
          client: '1',
          redirectURI: 'http://www.example.com/auth/callback',
          req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
        }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should restore transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.equal(req.oauth2.transactionID, '1234');
        assert.equal(req.oauth2.client.id, '1');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://www.example.com/auth/callback');
        assert.equal(req.oauth2.req.redirectURI, 'http://www.example.com/auth/callback');
        assert.equal(req.oauth2.req.foo, 'bar');
      },
      'should leave transaction in session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['1234']);
      },
    },
  },
  
  'middleware with sessionKey option that loads a transaction': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(null, { id: id, name: 'Example' })
      });
      
      return transactionLoader(server, { sessionKey: 'oauth2orize' });
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.body = { 'transaction_id': '1234' }
        req.session = {};
        req.session.oauth2orize = {};
        req.session.oauth2orize['1234'] = {
          client: '1',
          redirectURI: 'http://www.example.com/auth/callback',
          req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
        }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should restore transaction' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.equal(req.oauth2.transactionID, '1234');
        assert.equal(req.oauth2.client.id, '1');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://www.example.com/auth/callback');
        assert.equal(req.oauth2.req.redirectURI, 'http://www.example.com/auth/callback');
        assert.equal(req.oauth2.req.foo, 'bar');
      },
      'should leave transaction in session' : function(err, req, res, e) {
        assert.isObject(req.session['oauth2orize']['1234']);
      },
    },
  },
  
  'middleware that has deauthorized a client': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(null, false);
      });
      
      return transactionLoader(server);
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.body = { 'transaction_id': '1234' }
        req.session = {};
        req.session.authorize = {};
        req.session.authorize['1234'] = {
          client: '1',
          redirectURI: 'http://www.example.com/auth/callback',
          req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
        }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.code, 'unauthorized_client');
      },
      'should not restore transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2);
      },
      'should remove transaction from session' : function(err, req, res, e) {
        assert.isUndefined(req.session['authorize']['1234']);
      },
    },
  },
  
  'middleware that errors while deserializing a client': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(new Error('something went wrong'))
      });
      
      return transactionLoader(server);
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.body = { 'transaction_id': '1234' }
        req.session = {};
        req.session.authorize = {};
        req.session.authorize['1234'] = {
          client: '1',
          redirectURI: 'http://www.example.com/auth/callback',
          req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
        }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
      },
      'should not restore transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2);
      },
      'should leave transaction in session' : function(err, req, res, e) {
        assert.isObject(req.session['authorize']['1234']);
      },
    },
  },
  
  'middleware that handles a request without a transaction id': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(null, { id: id, name: 'Example' })
      });
      
      return transactionLoader(server);
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.session = {};
        req.session.authorize = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should not restore transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2);
      },
    },
  },
  
  'middleware that handles a request without a transaction in the session': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(null, { id: id, name: 'Example' })
      });
      
      return transactionLoader(server);
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.body = { 'transaction_id': '1234' }
        req.session = {};
        req.session.authorize = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should not restore transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2);
      },
    },
  },
  
  'middleware that handles a request without a session': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(null, { id: id, name: 'Example' })
      });
      
      return transactionLoader(server);
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.body = { 'transaction_id': '1234' }
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'OAuth 2.0 server requires session support.');
      },
      'should not restore transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2);
      },
    },
  },
  
  'middleware that handles a request without authorization transactions in the session': {
    topic: function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        return done(null, { id: id, name: 'Example' })
      });
      
      return transactionLoader(server);
    },

    'when handling a request': {
      topic: function(transactionLoader) {
        var self = this;
        var req = new MockRequest();
        req.body = { 'transaction_id': '1234' }
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          transactionLoader(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'Invalid OAuth 2.0 session key.');
      },
      'should not restore transaction' : function(err, req, res, e) {
        assert.isUndefined(req.oauth2);
      },
    },
  },

  'middleware constructed without a server instance': {
    'should throw an error': function () {
      assert.throws(function() { transactionLoader() });
    },
  },

}).export(module);
