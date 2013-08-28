var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var authorization = require('../../lib/middleware/authorization');
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

MockResponse.prototype.end = function(data, encoding) {
  this._data += data;
  if (this.done) { this.done(); }
}


vows.describe('authorization').addBatch({
  
  // OK
  'middleware that validates a request using client ID and redirect URI': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, function(clientID, redirectURI, done) {
        if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback') {
          var client = { id: '1234', name: 'Example' };
          return done(null, client, 'http://example.com/auth/callback');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth2 transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.isString(req.oauth2.transactionID);
        assert.lengthOf(req.oauth2.transactionID, 8);
        assert.equal(req.oauth2.client.id, '1234');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.oauth2.req.type, 'code');
        assert.equal(req.oauth2.req.clientID, '1234');
        assert.equal(req.oauth2.req.redirectURI, 'http://example.com/auth/callback');
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth2.transactionID;
        assert.isObject(req.session['authorize'][tid]);
        assert.equal(req.session['authorize'][tid].protocol, 'oauth2');
        assert.equal(req.session['authorize'][tid].client, '1234');
        assert.equal(req.session['authorize'][tid].redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.type, 'code');
        assert.equal(req.session['authorize'][tid].req.clientID, '1234');
        assert.equal(req.session['authorize'][tid].req.redirectURI, 'http://example.com/auth/callback');
      },
    },
  },
  
  // OK
  'middleware that validates a request using client ID, redirect URI, and scope': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri'],
          scope: req.query['scope']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, function(clientID, redirectURI, scope, done) {
        if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback' && scope == 'write') {
          var client = { id: '1234', name: 'Example' };
          return done(null, client, 'http://example.com/auth/callback');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'write' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth2 transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.isString(req.oauth2.transactionID);
        assert.lengthOf(req.oauth2.transactionID, 8);
        assert.equal(req.oauth2.client.id, '1234');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.oauth2.req.type, 'code');
        assert.equal(req.oauth2.req.clientID, '1234');
        assert.equal(req.oauth2.req.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.oauth2.req.scope, 'write');
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth2.transactionID;
        assert.isObject(req.session['authorize'][tid]);
        assert.equal(req.session['authorize'][tid].protocol, 'oauth2');
        assert.equal(req.session['authorize'][tid].client, '1234');
        assert.equal(req.session['authorize'][tid].redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.type, 'code');
        assert.equal(req.session['authorize'][tid].req.clientID, '1234');
        assert.equal(req.session['authorize'][tid].req.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.scope, 'write');
      },
    },
  },
  
  // OK
  'middleware that validates a request using client ID, redirect URI, scope, and type': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri'],
          scope: req.query['scope']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, function(clientID, redirectURI, scope, type, done) {
        if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback' && scope == 'write' && type == 'code') {
          var client = { id: '1234', name: 'Example' };
          return done(null, client, 'http://example.com/auth/callback');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'write' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth2 transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.isString(req.oauth2.transactionID);
        assert.lengthOf(req.oauth2.transactionID, 8);
        assert.equal(req.oauth2.client.id, '1234');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.oauth2.req.type, 'code');
        assert.equal(req.oauth2.req.clientID, '1234');
        assert.equal(req.oauth2.req.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.oauth2.req.scope, 'write');
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth2.transactionID;
        assert.isObject(req.session['authorize'][tid]);
        assert.equal(req.session['authorize'][tid].protocol, 'oauth2');
        assert.equal(req.session['authorize'][tid].client, '1234');
        assert.equal(req.session['authorize'][tid].redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.type, 'code');
        assert.equal(req.session['authorize'][tid].req.clientID, '1234');
        assert.equal(req.session['authorize'][tid].req.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.scope, 'write');
      },
    },
  },
  
  // OK
  'middleware that validates a request using req only': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri'],
          scope: req.query['scope'],
          display: req.query['display']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, function(areq, done) {
        if (areq.clientID == '1234' && areq.redirectURI == 'http://example.com/auth/callback' && areq.display == 'mobile') {
          var client = { id: '1234', name: 'Example' };
          return done(null, client, 'http://example.com/auth/callback');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'write', display: 'mobile' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth2 transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.isString(req.oauth2.transactionID);
        assert.lengthOf(req.oauth2.transactionID, 8);
        assert.equal(req.oauth2.client.id, '1234');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.oauth2.req.type, 'code');
        assert.equal(req.oauth2.req.clientID, '1234');
        assert.equal(req.oauth2.req.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.oauth2.req.scope, 'write');
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth2.transactionID;
        assert.isObject(req.session['authorize'][tid]);
        assert.equal(req.session['authorize'][tid].protocol, 'oauth2');
        assert.equal(req.session['authorize'][tid].client, '1234');
        assert.equal(req.session['authorize'][tid].redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.type, 'code');
        assert.equal(req.session['authorize'][tid].req.clientID, '1234');
        assert.equal(req.session['authorize'][tid].req.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.scope, 'write');
      },
    },
  },
  
  // OK
  'middleware that handles a request that is not parsed': {
    topic: function() {
      var server = new Server();
      return authorization(server, function(clientID, redirectURI, done) {
        return done(new Error('should not be called'));
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = {};
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        //assert.equal(e.code, 'unsupported_response_type');
      },
    },
  },
  
  // OK
  'middleware that does not parse request due to unknown response_type param': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, function(clientID, redirectURI, done) {
        var client = { id: '1234', name: 'Example' };
        return done(null, client, 'http://example.com/auth/callback');
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'foo', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.code, 'unsupported_response_type');
      },
    },
  },
  
  // OK
  'middleware that does not validates a request': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, function(clientID, redirectURI, done) {
        return done(null, false);
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.message, 'not authorized');
        assert.equal(e.code, 'unauthorized_client');
      },
    },
  },
  
  // OK
  'middleware that does not validates a request but sets a redirect uri': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, function(clientID, redirectURI, done) {
        return done(null, false, 'http://example.com/auth/callback');
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.message, 'not authorized');
        assert.equal(e.code, 'unauthorized_client');
      },
      'should set redirectURI on oauth transaction' : function(err, req, res, e) {
        assert.equal(req.oauth2.redirectURI, 'http://example.com/auth/callback');
      },
    },
  },
  
  // OK
  'middleware that throws when parsing a request': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        throw new Error('something went wrong parsing request');
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, function(clientID, redirectURI, done) {
        var client = { id: '1234', name: 'Example' };
        return done(null, client, 'http://example.com/auth/callback');
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong parsing request');
      },
    },
  },
  
  // OK
  'middleware that errors when validating a request': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, function(clientID, redirectURI, done) {
        return done(new Error('something went wrong in validate callback'));
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong in validate callback');
      },
    },
  },
  
  // OK
  'middleware that errors when serializing client': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri']
        }
      });
      server.serializeClient(function(client, done) {
        return done(new Error('something went wrong in client serializer'));
      });
      
      return authorization(server, function(clientID, redirectURI, done) {
        var client = { id: '1234', name: 'Example' };
        return done(null, client, 'http://example.com/auth/callback');
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong in client serializer');
      },
    },
  },
  
  'middleware that validates a request and has idLength option set': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, { idLength: 12 }, function(clientID, redirectURI, done) {
        var client = { id: '1234', name: 'Example' };
        return done(null, client, 'http://example.com/auth/callback');
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth2 transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.isString(req.oauth2.transactionID);
        assert.lengthOf(req.oauth2.transactionID, 12);
        assert.equal(req.oauth2.client.id, '1234');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.oauth2.req.type, 'code');
        assert.equal(req.oauth2.req.clientID, '1234');
        assert.equal(req.oauth2.req.redirectURI, 'http://example.com/auth/callback');
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth2.transactionID;
        assert.isObject(req.session['authorize'][tid]);
        assert.equal(req.session['authorize'][tid].protocol, 'oauth2');
        assert.equal(req.session['authorize'][tid].client, '1234');
        assert.equal(req.session['authorize'][tid].redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.session['authorize'][tid].req.type, 'code');
        assert.equal(req.session['authorize'][tid].req.clientID, '1234');
        assert.equal(req.session['authorize'][tid].req.redirectURI, 'http://example.com/auth/callback');
      },
    },
  },
  
  'middleware that validates a request and has sessionKey option set': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, { sessionKey: 'oauth2z' }, function(clientID, redirectURI, done) {
        var client = { id: '1234', name: 'Example' };
        return done(null, client, 'http://example.com/auth/callback');
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        req.session = {};
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should not next with error' : function(err, req, res, e) {
        assert.isUndefined(e);
      },
      'should add oauth2 transaction to req' : function(err, req, res, e) {
        assert.isObject(req.oauth2);
        assert.isString(req.oauth2.transactionID);
        assert.lengthOf(req.oauth2.transactionID, 8);
        assert.equal(req.oauth2.client.id, '1234');
        assert.equal(req.oauth2.client.name, 'Example');
        assert.equal(req.oauth2.redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.oauth2.req.type, 'code');
        assert.equal(req.oauth2.req.clientID, '1234');
        assert.equal(req.oauth2.req.redirectURI, 'http://example.com/auth/callback');
      },
      'should store transaction in session' : function(err, req, res, e) {
        var tid = req.oauth2.transactionID;
        assert.isObject(req.session['oauth2z'][tid]);
        assert.equal(req.session['oauth2z'][tid].protocol, 'oauth2');
        assert.equal(req.session['oauth2z'][tid].client, '1234');
        assert.equal(req.session['oauth2z'][tid].redirectURI, 'http://example.com/auth/callback');
        assert.equal(req.session['oauth2z'][tid].req.type, 'code');
        assert.equal(req.session['oauth2z'][tid].req.clientID, '1234');
        assert.equal(req.session['oauth2z'][tid].req.redirectURI, 'http://example.com/auth/callback');
      },
    },
  },
  
  'middleware that handles a request without a session': {
    topic: function() {
      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri']
        }
      });
      server.serializeClient(function(client, done) {
        return done(null, client.id);
      });
      
      return authorization(server, { sessionKey: 'oauth2z' }, function(clientID, redirectURI, done) {
        var client = { id: '1234', name: 'Example' };
        return done(null, client, 'http://example.com/auth/callback');
      });
    },

    'when handling a request': {
      topic: function(authorization) {
        var self = this;
        var req = new MockRequest();
        req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          authorization(req, res, next)
        });
      },

      'should not call done' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
      },
    },
  },
  
  // OK
  'middleware constructed without a server instance': {
    'should throw an error': function () {
      assert.throws(function() { authorization() });
    },
  },
  
  // OK
  'middleware constructed without a validate function': {
    'should throw an error': function () {
      assert.throws(function() { authorization({}) });
    },
  },

}).export(module);
