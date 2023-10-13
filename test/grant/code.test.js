/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true */

var chai = require('chai')
  , code = require('../../lib/grant/code')
  , AuthorizationError = require('../../lib/errors/authorizationerror');


describe('grant.code', function() {
  
  describe('module', function() {
    var mod = code(function(){});
    
    it('should be named code', function() {
      expect(mod.name).to.equal('code');
    });
    
    it('should expose request and response functions', function() {
      expect(mod.request).to.be.a('function');
      expect(mod.response).to.be.a('function');
    });
  });
  
  it('should throw if constructed without a issue callback', function() {
    expect(function() {
      code();
    }).to.throw(TypeError, 'oauth2orize.code grant requires an issue callback');
  });
  
  describe('request parsing', function() {
    function issue(){}
    
    describe('request', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(code(issue))
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
        chai.oauth2orize.grant(code(issue))
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
        chai.oauth2orize.grant(code(issue))
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
        chai.oauth2orize.grant(code({ scopeSeparator: ',' }, issue))
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
        chai.oauth2orize.grant(code({ scopeSeparator: [' ', ','] }, issue))
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
        chai.oauth2orize.grant(code({ scopeSeparator: [' ', ','] }, issue))
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
        chai.oauth2orize.grant(code(issue))
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

    describe('request with invalid client_id parameter', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(code(issue))
          .req(function(req) {
            req.query = {};
            req.query.client_id = ['c123', 'c123'];
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
        expect(err.message).to.equal('Invalid parameter: client_id must be a string');
        expect(err.code).to.equal('invalid_request');
      });
    });

   describe('request with scope parameter that is not a string', function() {
      var err, out;
      
      before(function(done) {
        chai.oauth2orize.grant(code(issue))
          .req(function(req) {
            req.query = {};
            req.query.client_id = 'c123';
            req.query.redirect_uri = 'http://example.com/auth/callback';
            req.query.state = 'f1o1o1';
            req.query.scope = ['read', 'write'];
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
        expect(err.message).to.equal('Invalid parameter: scope must be a string');
        expect(err.code).to.equal('invalid_request');
      });
    });
  });
  
  describe('decision handling', function() {
    
    describe('transaction', function() {
      var response;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, 'xyz');
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz');
      });
    });
    
    describe('transaction with request state', function() {
      var response;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, 'xyz');
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz&state=f1o1o1');
      });
    });
    
    describe('transaction with response extensions', function() {
      var response;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, 'xyz');
        }
        
        function extend(txn, done) {
          if (txn.client.id !== 'c123') { return done(new Error('incorrect txn argument')); }
          return done(null, { session_state: 'c1a43afe' });
        }
        
        chai.oauth2orize.grant(code(issue, extend))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz&session_state=c1a43afe');
      });
    });
    
    describe('transaction with request state and complete callback', function() {
      var response, completed;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, 'xyz');
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
          .decide(function(cb) {
            completed = true;
            process.nextTick(function() { cb() });
          });
      });
      
      it('should call complete callback', function() {
        expect(completed).to.be.true;
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz&state=f1o1o1');
      });
    });
    
    describe('disallowed transaction', function() {
      var response;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, 'xyz');
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?error=access_denied');
      });
    });
    
    describe('disallowed transaction with request state', function() {
      var response;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
          if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, 'xyz');
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?error=access_denied&state=f2o2o2');
      });
    });
    
    describe('unauthorized client', function() {
      var err;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          return done(null, false);
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'cUNAUTHZ', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
    
    describe('encountering an error while issuing code', function() {
      var err;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          return done(new Error('something went wrong'));
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'cERROR', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
        expect(err.message).to.equal('something went wrong');
      });
    });
    
    describe('throwing an error while issuing code', function() {
      var err;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          throw new Error('something was thrown');
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'cTHROW', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
    
    describe('encountering an error while extending response', function() {
      var err;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          return done(null, 'xyz');
        }
        
        function extend(txn, done) {
          return done(new Error('something went wrong'));
        }
        
        chai.oauth2orize.grant(code(issue, extend))
          .txn(function(txn) {
            txn.client = { id: 'cERROR', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
        expect(err.message).to.equal('something went wrong');
      });
    });
    
    describe('encountering an error while completing transaction', function() {
      var err;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          return done(null, 'xyz');
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'cERROR', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
          .decide(function(cb) {
            process.nextTick(function() { cb(new Error('failed to complete transaction')) });
          });
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('failed to complete transaction');
      });
    });
    
    describe('transaction without redirect URL', function() {
      var err;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
          return done(null, 'xyz');
        }
        
        chai.oauth2orize.grant(code(issue))
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
        expect(err).to.be.an.instanceOf(AuthorizationError);
        expect(err.code).to.equal('server_error');
        expect(err.message).to.equal('Unable to issue redirect for OAuth 2.0 transaction');
      });
    });
  });
  
  describe('decision handling with user response', function() {
    function issue(client, redirectURI, user, ares, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
      if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
      if (ares.scope !== 'foo') { return done(new Error('incorrect ares argument')); }
      
      return done(null, 'xyz');
    }
    
    describe('transaction with response scope', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
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
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz');
      });
    });
  });
  
  describe('decision handling with user response and client request', function() {
    function issue(client, redirectURI, user, ares, areq, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
      if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
      if (ares.scope !== 'foo') { return done(new Error('incorrect ares argument')); }
      if (areq.codeChallenge !== 'hashed-s3cr1t') { return done(new Error('incorrect areq argument')); }
      
      return done(null, 'xyz');
    }
    
    describe('transaction with response scope', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              codeChallenge: 'hashed-s3cr1t'
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
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz');
      });
    });
  });
  
  describe('decision handling with user response, client request, and server locals', function() {
    function issue(client, redirectURI, user, ares, areq, locals, done) {
      if (client.id !== 'c123') { return done(new Error('incorrect client argument')); }
      if (redirectURI !== 'http://example.com/auth/callback') { return done(new Error('incorrect redirectURI argument')); }
      if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
      if (ares.scope !== 'foo') { return done(new Error('incorrect ares argument')); }
      if (areq.codeChallenge !== 'hashed-s3cr1t') { return done(new Error('incorrect areq argument')); }
      if (locals.service.jwksURL !== 'http://www.example.com/.well-known/jwks') { return done(new Error('incorrect locals argument')); }
      
      return done(null, 'xyz');
    }
    
    describe('transaction with response scope', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              codeChallenge: 'hashed-s3cr1t'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true, scope: 'foo' };
            txn.locals = { service: { jwksURL: 'http://www.example.com/.well-known/jwks' } };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .decide();
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz');
      });
    });
  });
  
  describe('decision handling with response mode', function() {
    function issue(client, redirectURI, user, done) {
      return done(null, 'xyz');
    }
    
    var fooResponseMode = function(txn, res, params) {
      expect(txn.req.redirectURI).to.equal('http://example.com/auth/callback');
      expect(params.code).to.equal('xyz');
      expect(params.state).to.equal('s1t2u3');
      
      res.redirect('/foo');
    }
    
    
    describe('transaction using default response mode', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 's1t2u3'
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
        expect(response.getHeader('Location')).to.equal('http://www.example.com/auth/callback?code=xyz&state=s1t2u3');
      });
    });
    
    describe('transaction using foo response mode', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 's1t2u3',
              responseMode: 'foo'
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
        expect(response.getHeader('Location')).to.equal('/foo');
      });
    });
    
    describe('disallowed transaction using foo response mode', function() {
      var fooResponseMode = function(txn, res, params) {
        expect(txn.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(params.error).to.equal('access_denied');
        expect(params.state).to.equal('s1t2u3');
      
        res.redirect('/foo');
      }
      
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 's1t2u3',
              responseMode: 'foo'
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
        expect(response.getHeader('Location')).to.equal('/foo');
      });
    });
    
    describe('transaction using unsupported response mode', function() {
      var err;
      
      before(function(done) {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://www.example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 's1t2u3',
              responseMode: 'fubar'
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
        expect(err.message).to.equal('Unsupported response mode: fubar');
        expect(err.code).to.equal('unsupported_response_mode');
        expect(err.uri).to.equal(null);
        expect(err.status).to.equal(501);
      });
    });
  });
  
  describe('error handling', function() {
    
    describe('error on transaction', function() {
      var response;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
        }
        
        chai.oauth2orize.grant(code(issue))
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
          .error(new Error('something went wrong'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=server_error&error_description=something%20went%20wrong');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(response.body).to.be.undefined;
      });
    });
    
    describe('authorization error on transaction', function() {
      var response;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
        }
        
        chai.oauth2orize.grant(code(issue))
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
          .error(new AuthorizationError('not authorized', 'unauthorized_client'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(response.body).to.be.undefined;
      });
    });
    
    describe('authorization error with URI on transaction', function() {
      var response;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
        }
        
        chai.oauth2orize.grant(code(issue))
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
          .error(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized&error_uri=http%3A%2F%2Fexample.com%2Ferrors%2F2');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(response.body).to.be.undefined;
      });
    });
    
    describe('error on transaction with state', function() {
      var response;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .error(new Error('something went wrong'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=server_error&error_description=something%20went%20wrong&state=1234');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(response.body).to.be.undefined;
      });
    });
    
    describe('error on transaction without redirectURI', function() {
      var response, err;
      
      before(function(done) {
        function issue(client, redirectURI, user, done) {
        }
        
        chai.oauth2orize.grant(code(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .error(new Error('something went wrong'));
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });
  
  describe('error handling with response mode', function() {
    function issue(client, redirectURI, user, done) {
    }
    
    var fooResponseMode = function(txn, res, params) {
      expect(txn.req.redirectURI).to.equal('http://example.com/auth/callback');
      expect(params.error).to.equal('unauthorized_client');
      expect(params.error_description).to.equal('not authorized');
      expect(params.error_uri).to.equal('http://example.com/errors/2');
      expect(params.state).to.equal('1234');
      
      res.redirect('/foo');
    }
    
    
    describe('transaction using default response mode', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .error(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=unauthorized_client&error_description=not%20authorized&error_uri=http%3A%2F%2Fexample.com%2Ferrors%2F2&state=1234');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(response.body).to.be.undefined;
      });
    });
    
    describe('transaction using foo response mode', function() {
      var response;
      
      before(function(done) {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234',
              responseMode: 'foo'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .error(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('/foo');
        expect(response.getHeader('Content-Type')).to.be.undefined;
        expect(response.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should not set response body', function() {
        expect(response.body).to.be.undefined;
      });
    });
    
    describe('transaction using unsupported response mode', function() {
      var response, err;
      
      before(function(done) {
        chai.oauth2orize.grant(code({ modes: { foo: fooResponseMode } }, issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: '1234',
              responseMode: 'fubar'
            };
            txn.user = { id: 'u123', name: 'Bob' };
            txn.res = { allow: true };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .error(new AuthorizationError('not authorized', 'unauthorized_client', 'http://example.com/errors/2'));
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('not authorized');
        expect(err.code).to.equal('unauthorized_client');
        expect(err.uri).to.equal('http://example.com/errors/2');
        expect(err.status).to.equal(403);
      });
    });
  });
  
});
