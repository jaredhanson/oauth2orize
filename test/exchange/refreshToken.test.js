var chai = require('chai')
  , refreshToken = require('../../lib/exchange/refreshToken');


describe('exchange.refreshToken', function() {
  
  function issue(client, refreshToken, done) {
    if (client.id == 'c123' && refreshToken == 'refreshing') {
      return done(null, 's3cr1t')
    } else if (client.id == 'c223' && refreshToken == 'refreshing') {
      return done(null, 's3cr1t', 'getANotehr')
    } else if (client.id == 'c323' && refreshToken == 'refreshing') {
      return done(null, 's3cr1t', null, { 'expires_in': 3600 })
    } else if (client.id == 'c423' && refreshToken == 'refreshing') {
      return done(null, 's3cr1t', 'blahblag', { 'token_type': 'foo', 'expires_in': 3600 })
    }
    return done(new Error('something is wrong'));
  }
  
  it('should be named refresh_token', function() {
    expect(refreshToken(function(){}).name).to.equal('refresh_token');
  });
  
  it('should throw if constructed without a issue callback', function() {
    expect(function() {
      refreshToken();
    }).to.throw(TypeError, 'oauth2orize.refreshToken exchange requires an issue callback');
  });
  
  describe('issuing an access token', function() {
    var response, err;

    before(function(done) {
      chai.connect(refreshToken(issue))
        .req(function(req) {
          req.user = { id: 'c123', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
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
      expect(response.body).to.equal('{"access_token":"s3cr1t","token_type":"bearer"}');
    });
  });
  
  describe('issuing an access token and refresh token', function() {
    var response, err;

    before(function(done) {
      chai.connect(refreshToken(issue))
        .req(function(req) {
          req.user = { id: 'c223', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
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
      expect(response.body).to.equal('{"access_token":"s3cr1t","refresh_token":"getANotehr","token_type":"bearer"}');
    });
  });
  
  describe('issuing an access token, null refresh token, and params', function() {
    var response, err;

    before(function(done) {
      chai.connect(refreshToken(issue))
        .req(function(req) {
          req.user = { id: 'c323', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
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
      expect(response.body).to.equal('{"access_token":"s3cr1t","expires_in":3600,"token_type":"bearer"}');
    });
  });
  
  describe('issuing an access token, refresh token, and params with token_type', function() {
    var response, err;

    before(function(done) {
      chai.connect(refreshToken(issue))
        .req(function(req) {
          req.user = { id: 'c423', name: 'Example' };
          req.body = { refresh_token: 'refreshing' };
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
  
});
