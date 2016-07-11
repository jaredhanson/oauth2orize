/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true, sub: true */

var chai = require('chai')
  , resume = require('../../lib/middleware/resume')
  , Server = require('../../lib/server');


describe('authorization', function() {
  
  it('should be named resume', function() {
    var server = new Server();
    expect(resume(server, function(){}).name).to.equal('resume');
  });
  
  it('should throw if constructed without a server argument', function() {
    expect(function() {
      resume();
    }).to.throw(TypeError, 'oauth2orize.resume middleware requires a server argument');
  });
  
  it('should throw if constructed without a immediate argument', function() {
    expect(function() {
      var server = new Server();
      resume(server);
    }).to.throw(TypeError, 'oauth2orize.resume middleware requires an immediate function');
  });
  
  describe('immediate response', function() {
    var server, immediate;
    
    before(function() {
      server = new Server();
      server.grant('code', 'response', function(txn, res, next) {
        if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        if (txn.res.allow !== true) { return done(new Error('incorrect ares argument')); }
        if (txn.res.scope !== 'profile email') { return done(new Error('incorrect ares argument')); }
        
        return res.redirect(txn.redirectURI);
      });
    });
    
    before(function() {
      immediate = function(client, user, done) {
        if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        
        return done(null, true, { scope: 'profile email' });
      };
    });
  
    describe('based on client and user', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, true, { scope: 'profile email' });
        };
      });

      before(function(done) {
        chai.connect.use('express', resume(server, immediate))
          .req(function(req) {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s'};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should not error', function() {
        expect(err).to.be.undefined;
      });
      
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
    
    describe('based on client, user, and scope', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          
          return done(null, true, { scope: 'profile email' });
        };
      });

      before(function(done) {
        chai.connect.use('express', resume(server, immediate))
          .req(function(req) {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s'};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should not error', function() {
        expect(err).to.be.undefined;
      });
      
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
    
    describe('based on client, user, scope, and type', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          
          return done(null, true, { scope: 'profile email' });
        };
      });

      before(function(done) {
        chai.connect.use('express', resume(server, immediate))
          .req(function(req) {
            request = req;
            req.body = { code: '832076', _xsrf: '3ndukf8s'};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u123', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: '1234', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should not error', function() {
        expect(err).to.be.undefined;
      });
      
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('profile email');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
  });
  
  describe('prerequisite middleware checks', function() {
    var server;
    
    before(function() {
      server = new Server();
    });
    
    describe('handling a request without a transaction', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(resume(server, function(){}))
          .req(function(req) {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('OAuth2orize requires transaction support. Did you forget oauth2orize.transactionLoader(...)?');
      });
    
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
      });
    });
    
  });
  
});
