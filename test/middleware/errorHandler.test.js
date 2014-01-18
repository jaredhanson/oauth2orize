/* global describe, it, expect, before */
/* jshint expr: true */

var chai = require('chai')
  , errorHandler = require('../../lib/middleware/errorHandler')
  , AuthorizationError = require('../../lib/errors/authorizationerror');


describe('errorHandler', function() {
  
  it('should be named errorHandler', function() {
    expect(errorHandler().name).to.equal('errorHandler');
  });
  
  describe('direct mode', function() {
    describe('handling an error', function() {
      var res;
  
      before(function(done) {
        chai.connect.use(errorHandler())
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(500);
        expect(res.getHeader('Content-Type')).to.equal('application/json');
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should set response body', function() {
        expect(res.body).to.equal('{"error":"server_error","error_description":"something went wrong"}');
      });
    });
    
    describe('handling an authorization error', function() {
      var res;
  
      before(function(done) {
        chai.connect.use(errorHandler())
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('something went wrong', 'invalid_request'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(400);
        expect(res.getHeader('Content-Type')).to.equal('application/json');
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should set response body', function() {
        expect(res.body).to.equal('{"error":"invalid_request","error_description":"something went wrong"}');
      });
    });
    
    describe('handling an authorization error with URI', function() {
      var res;
  
      before(function(done) {
        chai.connect.use(errorHandler())
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('something went wrong', 'invalid_request', 'http://example.com/errors/1'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(400);
        expect(res.getHeader('Content-Type')).to.equal('application/json');
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should set response body', function() {
        expect(res.body).to.equal('{"error":"invalid_request","error_description":"something went wrong","error_uri":"http://example.com/errors/1"}');
      });
    });
  });
  
  describe('indirect mode', function() {
    describe('handling an error', function() {
      var res;
  
      before(function(done) {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req(function(req) {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback?error=server_error&error_description=something%20went%20wrong');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(res.body).to.be.undefined;
      });
    });
    
    describe('handling an authorization error', function() {
      var res;
  
      before(function(done) {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req(function(req) {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('not authorized', 'unauthorized_client'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(res.body).to.be.undefined;
      });
    });
    
    describe('handling an authorization error with URI', function() {
      var res;
  
      before(function(done) {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req(function(req) {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized&error_uri=http%3A%2F%2Fexample.com%2Ferrors%2F2');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(res.body).to.be.undefined;
      });
    });
    
    describe('handling an error with state', function() {
      var res;
  
      before(function(done) {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req(function(req) {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { state: '1234' };
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback?error=server_error&error_description=something%20went%20wrong&state=1234');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(res.body).to.be.undefined;
      });
    });
    
    describe('handling an error using token response', function() {
      var res;
  
      before(function(done) {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req(function(req) {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'token' };
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=server_error&error_description=something%20went%20wrong');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(res.body).to.be.undefined;
      });
    });
    
    describe('handling an authorization error using token response', function() {
      var res;
  
      before(function(done) {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req(function(req) {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'token' };
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('not authorized', 'unauthorized_client'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=unauthorized_client&error_description=not%20authorized');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(res.body).to.be.undefined;
      });
    });
    
    describe('handling an authorization error with URI using token response', function() {
      var res;
  
      before(function(done) {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req(function(req) {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'token' };
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=unauthorized_client&error_description=not%20authorized&error_uri=http%3A%2F%2Fexample.com%2Ferrors%2F2');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(res.body).to.be.undefined;
      });
    });
    
    describe('handling an error with state using token response', function() {
      var res;
  
      before(function(done) {
        chai.connect.use('express', errorHandler({ mode: 'indirect' }))
          .req(function(req) {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'token', state: '1234' };
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=server_error&error_description=something%20went%20wrong&state=1234');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(res.body).to.be.undefined;
      });
    });
    
    describe('handling an error using fragment encoding for extension response type', function() {
      var res;
  
      before(function(done) {
        chai.connect.use('express', errorHandler({ mode: 'indirect', fragment: ['token', 'id_token'] }))
          .req(function(req) {
            req.oauth2 = { redirectURI: 'http://example.com/auth/callback' };
            req.oauth2.req = { type: 'code id_token' };
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(302);
        expect(res.getHeader('Location')).to.equal('http://example.com/auth/callback#error=server_error&error_description=something%20went%20wrong');
        expect(res.getHeader('Content-Type')).to.be.undefined;
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(res.body).to.be.undefined;
      });
    });
    
    describe('handling a request error without an OAuth 2.0 transaction', function() {
      var err;
  
      before(function(done) {
        chai.connect.use(errorHandler({ mode: 'indirect' }))
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should next with error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
    
    describe('handling a request error without a redirect URI', function() {
      var err;
  
      before(function(done) {
        chai.connect.use(errorHandler({ mode: 'indirect' }))
          .req(function(req) {
            req.oauth2 = {};
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should next with error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });
  
  describe('unknown mode', function() {
    describe('handling an error', function() {
      var err;
  
      before(function(done) {
        chai.connect.use(errorHandler({ mode: 'unknown' }))
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should next with error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });
  
});

