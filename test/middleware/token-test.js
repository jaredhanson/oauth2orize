var vows = require('vows');
var assert = require('assert');
var url = require('url');
var util = require('util');
var token = require('../../lib/middleware/token');
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


vows.describe('token').addBatch({
  
  'middleware that issues an access token': {
    topic: function() {
      var server = new Server();
      server.exchange('authorization_code', function(req, res, next) {
        if (req.body.code == 'abc123') {
          var json = JSON.stringify({ token_type: 'bearer', access_token: 'aaa-111-ccc' });
          res.end(json);
        } else {
          return done(new Error('something is wrong'));
        }
      });
      
      return token(server);
    },

    'when handling a request': {
      topic: function(token) {
        var self = this;
        var req = new MockRequest();
        req.body = { grant_type: 'authorization_code', code: 'abc123' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        }

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          token(req, res, next)
        });
      },

      'should not call next' : function(err, req, res, e) {
        assert.isNull(err);
      },
      'should send response' : function(err, req, res) {
        assert.equal(res._data, '{"token_type":"bearer","access_token":"aaa-111-ccc"}');
      },
    },
  },
  
  'middleware that handles a request with an unsupported grant type': {
    topic: function() {
      var server = new Server();
      server.exchange('authorization_code', function(req, res, next) {
        var json = JSON.stringify({ token_type: 'bearer', access_token: 'aaa-111-ccc' });
        res.end(json);
      });
      
      return token(server);
    },

    'when handling a request': {
      topic: function(token) {
        var self = this;
        var req = new MockRequest();
        req.body = { grant_type: 'foo', code: 'abc123' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          token(req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.code, 'unsupported_grant_type');
      },
    },
  },
  
  'middleware that errors while exhanging a grant': {
    topic: function() {
      var server = new Server();
      server.exchange('authorization_code', function(req, res, next) {
        next(new Error('something went wrong'));
      });
      
      return token(server);
    },

    'when handling a request': {
      topic: function(token) {
        var self = this;
        var req = new MockRequest();
        req.body = { grant_type: 'authorization_code', code: 'abc123' };
        
        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        }

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          token(req, res, next)
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
      },
    },
  },
  
  'middleware constructed without a server instance': {
    'should throw an error': function () {
      assert.throws(function() { token() });
    },
  },

}).export(module);
