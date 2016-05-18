var chai = require('chai')
  , clientCredentials = require('../../lib/exchange/clientCredentials');


describe('exchange.clientCredentials', function() {

  function issue(client, done) {
    if (client.id == 'c123') {
      return done(null, 's3cr1t')
    } else if (client.id == 'c223') {
      return done(null, 's3cr1t', 'getANotehr')
    } else if (client.id == 'c323') {
      return done(null, 's3cr1t', null, { 'expires_in': 3600 })
    } else if (client.id == 'c423') {
      return done(null, 's3cr1t', 'blahblag', { 'token_type': 'foo', 'expires_in': 3600 })
    } else if (client.id == 'c523') {
      return done(null, 's3cr1t', { 'expires_in': 3600 })
    } else if (client.id == 'cUN') {
      return done(null, false)
    } else if (client.id == 'cTHROW') {
      throw new Error('something was thrown')
    }
    return done(new Error('something is wrong'));
  }

  it('should be named client_credentials', function() {
    expect(clientCredentials(function(){}).name).to.equal('client_credentials');
  });

  it('should throw if constructed without a issue callback', function() {
    expect(function() {
      clientCredentials();
    }).to.throw(TypeError, 'oauth2orize.clientCredentials exchange requires an issue callback');
  });

  describe('issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = {};
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token and refresh token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c223', name: 'Example' };
          req.body = {};
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","refresh_token":"getANotehr","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token and params', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c523', name: 'Example' };
          req.body = {};
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","expires_in":3600,"token_type":"Bearer"}');
    });
  });

  describe('issuing an access token, null refresh token, and params', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c323', name: 'Example' };
          req.body = {};
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","expires_in":3600,"token_type":"Bearer"}');
    });
  });

  describe('issuing an access token, refresh token, and params with token_type', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c423', name: 'Example' };
          req.body = {};
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","refresh_token":"blahblag","token_type":"foo","expires_in":3600}');
    });
  });

  describe('issuing an access token based on scope', function() {
    function issue(client, scope, done) {
      if (client.id == 'c123' && scope.length == 1 && scope[0] == 'read') {
        return done(null, 's3cr1t')
      }
      return done(new Error('something is wrong'));
    }

    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { scope: 'read' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token based on scope and body', function() {
    function issue(client, scope, body, done) {
      if (client.id == 'c123' && scope.length == 1 && scope[0] == 'read' && body.audience == 'https://www.example.com/') {
        return done(null, 's3cr1t')
      }
      return done(new Error('something is wrong'));
    }

    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { scope: 'read', audience: 'https://www.example.com/' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token based on scope and body with access to headers', function() {
    function issue(client, scope, body, headers, done) {
      if (client.id == 'c123' && scope.length == 1 && scope[0] == 'read'
          && body.audience == 'https://www.example.com/' && headers != null) {
        return done(null, 's3cr1t')
      }
      return done(new Error('something is wrong'));
    }

    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { scope: 'read', audience: 'https://www.example.com/' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('issuing an access token based on array of scopes', function() {
    function issue(client, scope, done) {
      if (client.id == 'c123' && scope.length == 2 && scope[0] == 'read' && scope[1] == 'write') {
        return done(null, 's3cr1t')
      }
      return done(new Error('something is wrong'));
    }

    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { scope: 'read write' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

  describe('not issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'cUN', name: 'Example' };
          req.body = {};
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.constructor.name).to.equal('TokenError');
      expect(err.message).to.equal('Invalid client credentials');
      expect(err.code).to.equal('invalid_grant');
      expect(err.status).to.equal(403);
    });
  });

  describe('encountering an error while issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'cXXX', name: 'Example' };
          req.body = {};
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something is wrong');
    });
  });

  describe('encountering an exception while issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'cTHROW', name: 'Example' };
          req.body = {};
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('something was thrown');
    });
  });

  describe('handling a request without a body', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error', function() {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.message).to.equal('OAuth2orize requires body parsing. Did you forget app.use(express.bodyParser())?');
    });
  });

  describe('with scope separator option', function() {
    function issue(client, scope, done) {
      if (client.id == 'c123' && scope.length == 2 && scope[0] == 'read' && scope[1] == 'write') {
        return done(null, 's3cr1t')
      }
      return done(new Error('something is wrong'));
    }

    describe('issuing an access token based on scope', function() {
      var response, err;

      before(function(done) {
        chai.connect.use(clientCredentials({ scopeSeparator: ',' }, issue))
          .req(function(req) {
            req.user = { id: 'c123', name: 'Example' };
            req.body = { scope: 'read,write' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should respond with headers', function() {
        expect(response.getHeader('Content-Type')).to.equal('application/json');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
      });

      it('should respond with body', function() {
        expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
      });
    });
  });

  describe('with multiple scope separator option', function() {
    function issue(client, scope, done) {
      if (client.id == 'c123' && scope.length == 2 && scope[0] == 'read' && scope[1] == 'write') {
        return done(null, 's3cr1t')
      }
      return done(new Error('something is wrong'));
    }

    describe('issuing an access token based on scope separated by space', function() {
      var response, err;

      before(function(done) {
        chai.connect.use(clientCredentials({ scopeSeparator: [' ', ','] }, issue))
          .req(function(req) {
            req.user = { id: 'c123', name: 'Example' };
            req.body = { scope: 'read write' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should respond with headers', function() {
        expect(response.getHeader('Content-Type')).to.equal('application/json');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
      });

      it('should respond with body', function() {
        expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
      });
    });

    describe('issuing an access token based on scope separated by comma', function() {
      var response, err;

      before(function(done) {
        chai.connect.use(clientCredentials({ scopeSeparator: [' ', ','] }, issue))
          .req(function(req) {
            req.user = { id: 'c123', name: 'Example' };
            req.body = { scope: 'read,write' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });

      it('should respond with headers', function() {
        expect(response.getHeader('Content-Type')).to.equal('application/json');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
      });

      it('should respond with body', function() {
        expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
      });
    });
  });

  describe('with user property option issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(clientCredentials({ userProperty: 'client' }, issue))
        .req(function(req) {
          req.client = { id: 'c123', name: 'Example' };
          req.body = {};
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });

    it('should respond with headers', function() {
      expect(response.getHeader('Content-Type')).to.equal('application/json');
      expect(response.getHeader('Cache-Control')).to.equal('no-store');
      expect(response.getHeader('Pragma')).to.equal('no-cache');
    });

    it('should respond with body', function() {
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"Bearer"}');
    });
  });

});
