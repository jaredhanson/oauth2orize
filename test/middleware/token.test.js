/* global describe, it, expect, before */
/* jshint camelcase: false */

var chai = require('chai')
  , token = require('../../lib/middleware/token')
  , Server = require('../../lib/server');


describe('token', function() {
  
  it('should be named token', function() {
    var server = new Server();
    expect(token(server).name).to.equal('token');
  });
  
  it('should throw if constructed without a server argument', function() {
    expect(function() {
      token();
    }).to.throw(TypeError, 'oauth2orize.token middleware requires a server argument');
  });
  
  
  describe('exchanging a grant for an access token', function() {
    var server = new Server();
    
    server.exchange('authorization_code', function(req, res, next) {
      if (req.body.code !== 'abc123') { return done(new Error('incorrect req.body argument')); }
      var json = JSON.stringify({ token_type: 'bearer', access_token: 'aaa-111-ccc' });
      return res.end(json);
    });
    
    server.exchange('fubar', function(req, res, next) {
      next(new Error('something went wrong'));
    });
  
  
    describe('handling a request with supported grant', function() {
      var response;

      before(function(done) {
        chai.connect.use(token(server))
          .req(function(req) {
            req.body = { grant_type: 'authorization_code', code: 'abc123' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should respond', function() {
        expect(response.body).to.equal('{"token_type":"bearer","access_token":"aaa-111-ccc"}');
      });
    });
  
    describe('handling a request with unsupported grant type', function() {
      var err;

      before(function(done) {
        chai.connect.use(token(server))
          .req(function(req) {
            req.body = { grant_type: 'foo', code: 'abc123' };
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
        expect(err.message).to.equal('Unsupported grant type: foo');
        expect(err.code).to.equal('unsupported_grant_type');
      });
    });
  
    describe('encountering an error while exchanging grant', function() {
      var err;

      before(function(done) {
        chai.connect.use(token(server))
          .req(function(req) {
            req.body = { grant_type: 'fubar', code: 'abc123' };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
    
  });
  
});
