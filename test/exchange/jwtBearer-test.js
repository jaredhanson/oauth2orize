var vows = require('vows');
var assert = require('assert');
var util = require('util');
var jwtBearer = require('exchange/jwtBearer');


function MockRequest() {
}

function MockResponse() {
  this._headers = {};
  this._data = '';
}

MockResponse.prototype.setHeader = function(name, value) {
  this._headers[name] = value;
};

MockResponse.prototype.end = function(data, encoding) {
  this._data += data;
  if (this.done) { this.done(); }
};

vows.describe('jwtBearer').addBatch({

  'middleware': {
    topic: function() {
      return jwtBearer(function() {});
    },

    'should return a function named jwt_bearer' : function(fn) {
      assert.isFunction(fn);
      assert.equal(fn.name, 'jwt_bearer');
    }
  },

  'middleware that issues an access token': {
    topic: function() {
      return jwtBearer(function(client, jwt, done) {
        if (client.id == 'c123' && jwt == 'header.claimSet.signature') {
          done(null, 's3cr1t');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { assertion: 'header.claimSet.signature' };

        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        };

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
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
      }
    }
  },

  'middleware that issues an access token and params': {
    topic: function() {
      return jwtBearer(function(client, jwt, done) {
        if (client.id == 'c123' && jwt == 'header.claimSet.signature') {
          done(null, 's3cr1t', { 'expires_in': 3600 });
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { assertion: 'header.claimSet.signature' };

        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        };

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
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
      }
    }
  },

  'middleware that issues an access token and params with token_type': {
    topic: function() {
      return jwtBearer(function(client, jwt, done) {
        if (client.id == 'c123' && jwt == 'header.claimSet.signature') {
          done(null, 's3cr1t', { 'token_type': 'foo', 'expires_in': 3600 });
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { assertion: 'header.claimSet.signature' };

        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        };

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
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
        assert.equal(res._data, '{"access_token":"s3cr1t","token_type":"foo","expires_in":3600}');
      }
    }
  },

  'middleware that issues an access token based on data and signature': {
    topic: function() {
      return jwtBearer(function(client, data, signature, done) {
        if (client.id == 'c123' && data == 'header.claimSet' &&
            signature == 'signature') {
          done(null, 's3cr1t');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { assertion: 'header.claimSet.signature' };

        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        };

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
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
      }
    }
  },

  'middleware that issues an access token based on header, claimSet and signature': {
    topic: function() {
      return jwtBearer(function(client, header, claimSet, signature, done) {
        if (client.id == 'c123' && header == 'header' &&
            claimSet == 'claimSet' && signature == 'signature') {
          done(null, 's3cr1t');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { assertion: 'header.claimSet.signature' };

        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        };

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
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
      }
    }
  },

  'middleware with userProperty option that issues an access token': {
    topic: function() {
      return jwtBearer({ userProperty: 'otheruser' }, function(client, jwt, done) {
        if (client.id == 'c123' && jwt == 'header.claimSet.signature') {
          done(null, 's3cr1t');
        } else {
          return done(new Error('something is wrong'));
        }
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.otheruser = { id: 'c123', name: 'Example' };
        req.body = { assertion: 'header.claimSet.signature' };

        var res = new MockResponse();
        res.done = function() {
          self.callback(null, req, res);
        };

        function next(err) {
          self.callback(new Error('should not be called'));
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
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
      }
    }
  },

  'middleware that does not issue an access token': {
    topic: function() {
      return jwtBearer(function(client, jwt, done) {
        return done(null, false);
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { assertion: 'header.claimSet.signature' };

        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        };

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.code, 'invalid_grant');
        assert.equal(e.message, 'invalid JWT');
      }
    }
  },

  'middleware that errors while issuing an access token': {
    topic: function() {
      return jwtBearer(function(client, jwt, done) {
        return done(new Error('something went wrong'));
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = { assertion: 'header.claimSet.signature' };

        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        };

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'something went wrong');
      }
    }
  },

  'middleware that handles a request lacking a JWT': {
    topic: function() {
      return jwtBearer(function(client, jwt, done) {
        return done(new Error('something went wrong'));
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };
        req.body = {};

        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        };

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.constructor.name, 'AuthorizationError');
        assert.equal(e.code, 'invalid_request');
        assert.equal(e.message, 'missing assertion parameter');
      }
    }
  },

  'middleware that handles a request in which the body was not parsed': {
    topic: function() {
      return jwtBearer(function(client, jwt, done) {
        return done(new Error('something went wrong'));
      });
    },

    'when handling a request': {
      topic: function(jwtBearer) {
        var self = this;
        var req = new MockRequest();
        req.user = { id: 'c123', name: 'Example' };

        var res = new MockResponse();
        res.done = function() {
          self.callback(new Error('should not be called'));
        };

        function next(err) {
          self.callback(null, req, res, err);
        }
        process.nextTick(function () {
          jwtBearer(req, res, next);
        });
      },

      'should not respond to request' : function(err, req, res) {
        assert.isNull(err);
      },
      'should next with error' : function(err, req, res, e) {
        assert.instanceOf(e, Error);
        assert.equal(e.message, 'Request body not parsed. Use bodyParser middleware.');
      }
    }
  },

  'middleware constructed without an issue function': {
    'should throw an error': function () {
      assert.throws(function() { jwtBearer(); });
    }
  }

}).export(module);
