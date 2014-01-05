var chai = require('chai')
  , authorizationCode = require('../../lib/exchange/authorizationCode');


describe('exchange.authorizationCode', function() {
  
  function issue(client, code, redirectURI, done) {
    if (client.id == 'c123' && code == 'abc123' && redirectURI == 'http://example.com/oa/callback') {
      return done(null, 's3cr1t');
    } else if (client.id == 'c223' && code == 'abc223' && redirectURI == 'http://example.com/oa/callback') {
      return done(null, 's3cr1t', 'getANotehr');
    } else if (client.id == 'c323' && code == 'abc323' && redirectURI == 'http://example.com/oa/callback') {
      return done(null, 's3cr1t', null, { 'expires_in': 3600 })
    } else if (client.id == 'c423' && code == 'abc423' && redirectURI == 'http://example.com/oa/callback') {
      return done(null, 's3cr1t', 'blahblag', { 'token_type': 'foo', 'expires_in': 3600 })
    } else if (client.id == 'c523' && code == 'abc523' && redirectURI == 'http://example.com/oa/callback') {
      return done(null, 's3cr1t', { 'expires_in': 3600 })
    } else if (client.id == 'cUN' && code == 'abcUN' && redirectURI == 'http://example.com/oa/callback') {
      return done(null, false)
    } else if (client.id == 'cTHROW') {
      throw new Error('something was thrown')
    }
    return done(new Error('something is wrong'));
  }
  
  it('should be named authorization_code', function() {
    expect(authorizationCode(function(){}).name).to.equal('authorization_code');
  });
  
  it('should throw if constructed without a issue callback', function() {
    expect(function() {
      authorizationCode();
    }).to.throw(TypeError, 'oauth2orize.authorizationCode exchange requires an issue callback');
  });
  
  describe('issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(authorizationCode(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
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
      chai.connect.use(authorizationCode(issue))
        .req(function(req) {
          req.user = { id: 'c223', name: 'Example' };
          req.body = { code: 'abc223', redirect_uri: 'http://example.com/oa/callback' };
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
      chai.connect.use(authorizationCode(issue))
        .req(function(req) {
          req.user = { id: 'c523', name: 'Example' };
          req.body = { code: 'abc523', redirect_uri: 'http://example.com/oa/callback' };
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
      chai.connect.use(authorizationCode(issue))
        .req(function(req) {
          req.user = { id: 'c323', name: 'Example' };
          req.body = { code: 'abc323', redirect_uri: 'http://example.com/oa/callback' };
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
      chai.connect.use(authorizationCode(issue))
        .req(function(req) {
          req.user = { id: 'c423', name: 'Example' };
          req.body = { code: 'abc423', redirect_uri: 'http://example.com/oa/callback' };
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
  
  describe('not issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(authorizationCode(issue))
        .req(function(req) {
          req.user = { id: 'cUN', name: 'Example' };
          req.body = { code: 'abcUN', redirect_uri: 'http://example.com/oa/callback' };
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
      expect(err.message).to.equal('Invalid authorization code');
      expect(err.code).to.equal('invalid_grant');
      expect(err.status).to.equal(403);
    });
  });
  
  describe('handling a request without code parameter', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(authorizationCode(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { redirect_uri: 'http://example.com/oa/callback' };
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
      expect(err.message).to.equal('Missing required parameter: code');
      expect(err.code).to.equal('invalid_request');
      expect(err.status).to.equal(400);
    });
  });
  
  describe('encountering an error while issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(authorizationCode(issue))
        .req(function(req) {
          req.user = { id: 'cXXX', name: 'Example' };
          req.body = { code: 'abcXXX', redirect_uri: 'http://example.com/oa/callback' };
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
      chai.connect.use(authorizationCode(issue))
        .req(function(req) {
          req.user = { id: 'cTHROW', name: 'Example' };
          req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
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
      chai.connect.use(authorizationCode(issue))
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
  
  describe('with user property option issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect.use(authorizationCode({ userProperty: 'client' }, issue))
        .req(function(req) {
          req.client = { id: 'c123', name: 'Example' };
          req.body = { code: 'abc123', redirect_uri: 'http://example.com/oa/callback' };
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
