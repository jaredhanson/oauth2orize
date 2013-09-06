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
    function issue(){};
    
    describe('request', function() {
      var err, out;
      
      before(function(done) {
        chai.grant(token(issue))
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
        chai.grant(token(issue))
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
        chai.grant(token(issue))
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
    
    describe('request with list of scopes and scope separator option', function() {
      var err, out;
      
      before(function(done) {
        chai.grant(token({ scopeSeparator: ',' }, issue))
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
    
    describe('request with list of scopes separated by space and multiple scope separator option', function() {
      var err, out;
      
      before(function(done) {
        chai.grant(token({ scopeSeparator: [' ', ','] }, issue))
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
    
    describe('request with list of scopes separated by comma and multiple scope separator option', function() {
      var err, out;
      
      before(function(done) {
        chai.grant(token({ scopeSeparator: [' ', ','] }, issue))
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
        chai.grant(token(issue))
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
      } else if (client.id == 'cUN') {
        return done(null, false);
      }
      return done(new Error('something is wrong'));
    }
    
    describe('transaction', function() {
      var response;
      
      before(function(done) {
        chai.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            }
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
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#access_token=xyz&token_type=bearer');
      });
    });
    
    describe('transaction with request state', function() {
      var response;
      
      before(function(done) {
        chai.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback',
              state: 'f1o1o1'
            }
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
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#access_token=xyz&token_type=bearer&state=f1o1o1');
      });
    });
    
    //
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
        chai.grant(token(issue))
          .txn(function(txn) {
            txn.client = { id: 'c123', name: 'Example' };
            txn.redirectURI = 'http://example.com/auth/callback';
            txn.req = {
              redirectURI: 'http://example.com/auth/callback'
            }
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
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback#access_token=xyz&token_type=bearer');
      });
    });
  });

});
