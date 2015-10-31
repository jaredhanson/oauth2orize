/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true */

var chai = require('chai')
  , token = require('../../lib/grant/token');


describe('grant.token', function() {
  
  describe('module', function() {
    var mod = token(function(){});
    
    it('should be named token', function() {
      expect(mod.name).to.equal('token');
    });
    
    it('should expose request and response functions', function() {
      expect(mod.request).to.be.a('function');
      expect(mod.response).to.be.a('function');
    });
  });
  
  it('should throw if constructed without a issue callback', function() {
    expect(function() {
      token();
    }).to.throw(TypeError, 'oauth2orize.token grant requires an issue callback');
  });
  
  describe('request parsing', function() {
    function issue(){}
    
    describe('request', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .req(function(req) {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.state = 'f1o1o1';
          })
          .parse(function(e, o) {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });
      
      it('should not error', function() {
        expect(err).to.be.null;
      });
      
      it('should parse request', function() {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.undefined;
        expect(out.state).to.equal('f1o1o1');
      });
    });
    
    describe('request with scope', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .req(function(req) {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read';
            req.query.state = 'f1o1o1';
          })
          .parse(function(e, o) {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });
      
      it('should not error', function() {
        expect(err).to.be.null;
      });
      
      it('should parse request', function() {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(1);
        expect(out.scope[0]).to.equal('read');
        expect(out.state).to.equal('f1o1o1');
      });
    });
    
    describe('request with list of scopes', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .req(function(req) {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read write';
            req.query.state = 'f1o1o1';
          })
          .parse(function(e, o) {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });
      
      it('should not error', function() {
        expect(err).to.be.null;
      });
      
      it('should parse request', function() {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(2);
        expect(out.scope[0]).to.equal('read');
        expect(out.scope[1]).to.equal('write');
        expect(out.state).to.equal('f1o1o1');
      });
    });
    
    describe('request with list of scopes using scope separator option', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(token({ scopeSeparator: ',' }, issue))
          .req(function(req) {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read,write';
            req.query.state = 'f1o1o1';
          })
          .parse(function(e, o) {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });
      
      it('should not error', function() {
        expect(err).to.be.null;
      });
      
      it('should parse request', function() {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(2);
        expect(out.scope[0]).to.equal('read');
        expect(out.scope[1]).to.equal('write');
        expect(out.state).to.equal('f1o1o1');
      });
    });
    
    describe('request with list of scopes separated by space using multiple scope separator option', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(token({ scopeSeparator: [' ', ','] }, issue))
          .req(function(req) {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read write';
            req.query.state = 'f1o1o1';
          })
          .parse(function(e, o) {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });
      
      it('should not error', function() {
        expect(err).to.be.null;
      });
      
      it('should parse request', function() {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(2);
        expect(out.scope[0]).to.equal('read');
        expect(out.scope[1]).to.equal('write');
        expect(out.state).to.equal('f1o1o1');
      });
    });
    
    describe('request with list of scopes separated by comma using multiple scope separator option', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(token({ scopeSeparator: [' ', ','] }, issue))
          .req(function(req) {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.scope = 'read,write';
            req.query.state = 'f1o1o1';
          })
          .parse(function(e, o) {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });
      
      it('should not error', function() {
        expect(err).to.be.null;
      });
      
      it('should parse request', function() {
        expect(out.clientID).to.equal('c123');
        expect(out.redirectURI).to.equal('http://example.com/auth/callback');
        expect(out.scope).to.be.an('array');
        expect(out.scope).to.have.length(2);
        expect(out.scope[0]).to.equal('read');
        expect(out.scope[1]).to.equal('write');
        expect(out.state).to.equal('f1o1o1');
      });
    });
    
    describe('request with missing client_id parameter', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .req(function(req) {
            req.query = {};
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.state = 'f1o1o1';
          })
          .parse(function(e, o) {
            err = e;
            out = o;
            done();
          })
          .authorize();
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Missing required parameter: client_id');
        expect(err.code).to.equal('invalid_request');
      });
    });
  });
  
  describe('decision handling', function() {
    function issue(client, user, done) {
      if (client.id == 'c123' && user.id == 'u123') {
        return done(null, 'xyz');
      } else if (client.id == 'c223' && user.id == 'u123') {
        return done(null, 'xyz', { 'expires_in': 3600 });
      } else if (client.id == 'c323' && user.id == 'u123') {
        return done(null, 'xyz', { 'token_type': 'foo', 'expires_in': 3600 });
      } else if (client.id == 'cUNAUTHZ') {
        return done(null, false);
      } else if (client.id == 'cTHROW') {
        throw new Error('something was thrown');
      }
      return done(new Error('something is wrong'));
    }
    
    describe('transaction', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#access_token=xyz&token_type=Bearer');
      });
    });
    
    describe('transaction with request state', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 'f1o1o1'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#access_token=xyz&token_type=Bearer&state=f1o1o1');
      });
    });
    
    describe('transaction that adds params to response', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c223', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#access_token=xyz&expires_in=3600&token_type=Bearer');
      });
    });
    
    describe('transaction that adds params including token_type to response', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c323', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#access_token=xyz&token_type=foo&expires_in=3600');
      });
    });
    
    describe('disallowed transaction', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: false };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#error=access_denied');
      });
    });
    
    describe('disallowed transaction with request state', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 'f2o2o2'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: false };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#error=access_denied&state=f2o2o2');
      });
    });
    
    describe('unauthorized client', function() {
      var err;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'cUNAUTHZ', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .decide();
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Request denied by authorization server');
        expect(err.code).to.equal('access_denied');
        expect(err.status).to.equal(403);
      });
    });
    
    describe('encountering an error while issuing token', function() {
      var err;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'cERROR', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .decide();
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something is wrong');
      });
    });
    
    describe('throwing an error while issuing token', function() {
      var err;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'cTHROW', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .decide();
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something was thrown');
      });
    });
    
    describe('transaction without redirect URL', function() {
      var err;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .decide();
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Unable to issue redirect for OAuth 2.0 transaction');
      });
    });
  });
  
  describe('decision handling with user response', function() {
    function issue(client, user, ares, done) {
      if (client.id == 'c123' && user.id == 'u123' && ares.scope == 'foo') {
        return done(null, 'xyz');
      }
      return done(new Error('something is wrong'));
    }
    
    describe('transaction with response scope', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true, scope: 'foo' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#access_token=xyz&token_type=Bearer');
      });
    });
  });

  describe('responseMode.form_post', function () {
    function issue(client, user, done) {
      if (client.id == 'c123' && user.id == 'u123') {
        return done(null, 'xyz');
      } else if (client.id == 'c223' && user.id == 'u123') {
        return done(null, 'xyz', { 'expires_in': 3600 });
      } else if (client.id == 'c323' && user.id == 'u123') {
        return done(null, 'xyz', { 'token_type': 'foo', 'expires_in': 3600 });
      } else if (client.id == 'cUNAUTHZ') {
        return done(null, false);
      } else if (client.id == 'cTHROW') {
        throw new Error('something was thrown');
      }
      return done(new Error('something is wrong'));
    }
    
    describe('transaction', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              responseMode: 'form_post'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(200);
        expect(response.getHeader('Content-Type')).to.equal('text/html;charset=UTF-8');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
        expect(response._data).to.have.string('<form method="post" action="http://example.com/auth/callback">');
        expect(response._data).to.have.string('<input type="hidden" name="access_token" value="xyz"/>');
        expect(response._data).to.have.string('<input type="hidden" name="token_type" value="Bearer"/>');
      });
    });
    
    describe('transaction with request state', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 'f1o1o1',
              responseMode: 'form_post'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(200);
        expect(response.getHeader('Content-Type')).to.equal('text/html;charset=UTF-8');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
        expect(response._data).to.have.string('<form method="post" action="http://example.com/auth/callback">');
        expect(response._data).to.have.string('<input type="hidden" name="access_token" value="xyz"/>');
        expect(response._data).to.have.string('<input type="hidden" name="token_type" value="Bearer"/>');
        expect(response._data).to.have.string('<input type="hidden" name="state" value="f1o1o1"/>');
      });
    });

    describe('disallowed transaction', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              responseMode: 'form_post'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: false };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(200);
        expect(response.getHeader('Content-Type')).to.equal('text/html;charset=UTF-8');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
        expect(response._data).to.have.string('<form method="post" action="http://example.com/auth/callback">');
        expect(response._data).to.have.string('<input type="hidden" name="error" value="access_denied"/>');
      });
    });
    
    describe('disallowed transaction with request state', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 'f2o2o2',
              responseMode: 'form_post'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: false };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(200);
        expect(response.getHeader('Content-Type')).to.equal('text/html;charset=UTF-8');
        expect(response.getHeader('Cache-Control')).to.equal('no-store');
        expect(response.getHeader('Pragma')).to.equal('no-cache');
        expect(response._data).to.have.string('<form method="post" action="http://example.com/auth/callback">');
        expect(response._data).to.have.string('<input type="hidden" name="error" value="access_denied"/>');
        expect(response._data).to.have.string('<input type="hidden" name="state" value="f2o2o2"/>');
      });
    });

    describe('transaction with unsupported responseMode', function() {
      var err;
      
      before(function(done) {
        chai.oauth2orize.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              responseMode: 'invalid_mode'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .decide();
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unsupported response mode: invalid_mode');
        expect(err.code).to.equal('unsupported_response_mode');
      });
    });
  });

});
