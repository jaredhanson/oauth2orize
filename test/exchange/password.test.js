var chai = require('chai')
  , password = require('../../lib/exchange/password');


describe('exchange.password', function() {
  
  it('should be named password', function() {
    expect(password(function(){}).name).to.equal('password');
  });
  
  it('should throw if constructed without a issue callback', function() {
    expect(function() {
      password();
    }).to.throw(TypeError, 'oauth2orize.password exchange requires an issue callback');
  });
  
  describe('issuing an access token', function() {
    var response, err;

    before(function(done) {
      function issue(client, username, passwd, done) {
        if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
        if (username !== 'bob') { return done(new Error('incorrect username argument')); }
        if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
        
        return done(null, 's3cr1t')
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { username: 'bob', password: 'shh' };
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
      function issue(client, username, passwd, done) {
        if (client.id !== 'c223') { return done(new Error('incorrect client argument')); }
        if (username !== 'bob') { return done(new Error('incorrect username argument')); }
        if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
        
        return done(null, 's3cr1t', 'getANotehr')
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c223', name: 'Example' };
          req.body = { username: 'bob', password: 'shh' };
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
      function issue(client, username, passwd, done) {
        if (client.id !== 'c523') { return done(new Error('incorrect client argument')); }
        if (username !== 'bob') { return done(new Error('incorrect username argument')); }
        if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
        
        return done(null, 's3cr1t', { 'expires_in': 3600 })
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c523', name: 'Example' };
          req.body = { username: 'bob', password: 'shh' };
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
      function issue(client, username, passwd, done) {
        if (client.id !== 'c323') { return done(new Error('incorrect client argument')); }
        if (username !== 'bob') { return done(new Error('incorrect username argument')); }
        if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
        
        return done(null, 's3cr1t', null, { 'expires_in': 3600 })
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c323', name: 'Example' };
          req.body = { username: 'bob', password: 'shh' };
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
      function issue(client, username, passwd, done) {
        if (client.id !== 'c423') { return done(new Error('incorrect client argument')); }
        if (username !== 'bob') { return done(new Error('incorrect username argument')); }
        if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
        
        return done(null, 's3cr1t', 'blahblag', { 'token_type': 'foo', 'expires_in': 3600 })
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c423', name: 'Example' };
          req.body = { username: 'bob', password: 'shh' };
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
    function issue(client, username, passwd, scope, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (username !== 'bob') { return done(new Error('incorrect username argument')); }
      if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
      if (scope.length !== 1) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
      
      return done(null, 's3cr1t')
    }
    
    var response, err;

    before(function(done) {
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { username: 'bob', password: 'shh', scope: 'read' };
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
    function issue(client, username, passwd, scope, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (username !== 'bob') { return done(new Error('incorrect username argument')); }
      if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
      if (scope.length !== 2) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
      if (scope[1] !== 'write') { return done(new Error('incorrect scope argument')); }
      
      return done(null, 's3cr1t')
    }
    
    var response, err;

    before(function(done) {
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { username: 'bob', password: 'shh', scope: 'read write' };
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
    function issue(client, username, passwd, scope, body, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (username !== 'bob') { return done(new Error('incorrect username argument')); }
      if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
      if (scope.length !== 1) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
      if (body.audience !== 'https://www.example.com/') { return done(new Error('incorrect body argument')); }
      
      return done(null, 's3cr1t')
    }
    
    var response, err;

    before(function(done) {
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { username: 'bob', password: 'shh', scope: 'read', audience: 'https://www.example.com/' };
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
  
  describe('issuing an access token based on authInfo', function() {
    function issue(client, username, passwd, scope, body, authInfo, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (username !== 'bob') { return done(new Error('incorrect username argument')); }
      if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
      if (scope.length !== 1) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
      if (body.audience !== 'https://www.example.com/') { return done(new Error('incorrect body argument')); }
      if (authInfo.ip !== '127.0.0.1') { return done(new Error('incorrect authInfo argument')); }

      return done(null, 's3cr1t');
    }

    var response, err

    before(function(done) {
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { username: 'bob', password: 'shh', scope: 'read', audience: 'https://www.example.com/' };
          req.authInfo = { ip: '127.0.0.1' };
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
      function issue(client, username, passwd, done) {
        return done(null, false)
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'cUN', name: 'Example' };
          req.body = { username: 'bob', password: 'shh' };
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
      expect(err.message).to.equal('Invalid resource owner credentials');
      expect(err.code).to.equal('invalid_grant');
      expect(err.status).to.equal(403);
    });
  });
  
  describe('handling a request without username parameter', function() {
    var response, err;

    before(function(done) {
      function issue(client, username, passwd, done) {
        return done(null, '.ignore')
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { password: 'shh' };
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
      expect(err.message).to.equal('Missing required parameter: username');
      expect(err.code).to.equal('invalid_request');
      expect(err.status).to.equal(400);
    });
  });
  
  describe('handling a request without password parameter', function() {
    var response, err;

    before(function(done) {
      function issue(client, username, passwd, done) {
        return done(null, '.ignore')
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { username: 'bob' };
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
      expect(err.message).to.equal('Missing required parameter: password');
      expect(err.code).to.equal('invalid_request');
      expect(err.status).to.equal(400);
    });
  });
  
  describe('encountering an error while issuing an access token', function() {
    var response, err;

    before(function(done) {
      function issue(client, username, passwd, done) {
        return done(new Error('something is wrong'));
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'cXXX', name: 'Example' };
          req.body = { username: 'bob', password: 'shh' };
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
      function issue(client, username, passwd, done) {
        throw new Error('something was thrown')
      }
      
      chai.connect.use(password(issue))
        .req(function(req) {
          req.user = { id: 'cTHROW', name: 'Example' };
          req.body = { username: 'bob', password: 'shh' };
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
      function issue(client, username, passwd, done) {
        return done(new Error('something is wrong'));
      }
      
      chai.connect.use(password(issue))
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
  
  describe('handling a request where scope format is not string', function () {
    var response, err;

    before(function (done) {
      function issue(client, username, passwd, done) {
        return done(new Error('something is wrong'));
      }

      chai.connect.use(password(issue))
        .req(function (req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { username: 'bob', password: 'shh', scope: ['read', 'write'] };
        })
        .next(function (e) {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error', function () {
      expect(err).to.be.an.instanceOf(Error);
      expect(err.name).to.equal('TokenError');
      expect(err.message).to.equal('Invalid parameter: scope must be a string');
      expect(err.code).to.equal('invalid_request');
      expect(err.status).to.equal(400);
    });
  });

  describe('with scope separator option', function() {
    describe('issuing an access token based on array of scopes', function() {
      function issue(client, username, passwd, scope, done) {
        if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
        if (username !== 'bob') { return done(new Error('incorrect username argument')); }
        if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
        if (scope.length !== 2) { return done(new Error('incorrect scope argument')); }
        if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
        if (scope[1] !== 'write') { return done(new Error('incorrect scope argument')); }
      
        return done(null, 's3cr1t')
      }
    
      var response, err;

      before(function(done) {
        chai.connect.use(password({ scopeSeparator: ',' }, issue))
          .req(function(req) {
            req.user = { id: 'c123', name: 'Example' };
            req.body = { username: 'bob', password: 'shh', scope: 'read,write' };
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
    function issue(client, username, passwd, scope, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (username !== 'bob') { return done(new Error('incorrect username argument')); }
      if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
      if (scope.length !== 2) { return done(new Error('incorrect scope argument')); }
      if (scope[0] !== 'read') { return done(new Error('incorrect scope argument')); }
      if (scope[1] !== 'write') { return done(new Error('incorrect scope argument')); }
      
      return done(null, 's3cr1t')
    }
    
    describe('issuing an access token based on scope separated by space', function() {
      var response, err;

      before(function(done) {
        chai.connect.use(password({ scopeSeparator: [' ', ','] }, issue))
          .req(function(req) {
            req.user = { id: 'c123', name: 'Example' };
            req.body = { username: 'bob', password: 'shh', scope: 'read write' };
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
        chai.connect.use(password({ scopeSeparator: [' ', ','] }, issue))
          .req(function(req) {
            req.user = { id: 'c123', name: 'Example' };
            req.body = { username: 'bob', password: 'shh', scope: 'read,write' };
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
      function issue(client, username, passwd, done) {
        if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
        if (username !== 'bob') { return done(new Error('incorrect username argument')); }
        if (passwd !== 'shh') { return done(new Error('incorrect passwd argument')); }
        
        return done(null, 's3cr1t')
      }
      
      chai.connect.use(password({ userProperty: 'client' }, issue))
        .req(function(req) {
          req.client = { id: 'c123', name: 'Example' };
          req.body = { username: 'bob', password: 'shh' };
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
