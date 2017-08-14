/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true, sub: true */

var chai = require('chai')
  , resume = require('../../lib/middleware/resume')
  , Server = require('../../lib/server');


describe('resume', function() {
  
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
      
      it('should flag req.end as proxied', function() {
        expect(request.oauth2._endProxied).to.be.true;
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
    
    describe('based on client, user, scope, and type, and authorization request', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
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
    
    describe('based on client, user, scope, and type, and authorization request, that supplies locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          
          return done(null, true, { scope: 'profile email' }, { service: { name: 'Contacts' } });
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
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
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(1);
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
    
    describe('based on client, user, scope, and type, authorization request, and locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals !== undefined) { return done(new Error('incorrect locals argument')) };
          
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
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
    
    describe('based on client, user, scope, and type, authorization request, and response locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.grant.id !== 'g123') { return done(new Error('incorrect locals argument')) };
          
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .res(function(res) {
            res.locals = { grant: { id: 'g123' } };
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
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(1);
        expect(request.oauth2.locals.grant.id).to.equal('g123');
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
    
    describe('based on client, user, scope, and type, authorization request, and response and transaction locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.grant.id !== 'g123') { return done(new Error('incorrect locals argument')) };
          if (locals.service.name !== 'Contacts') { return done(new Error('incorrect locals argument')) };
          
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
            req.oauth2.locals = { service: { name: 'Contacts' } };
          })
          .res(function(res) {
            res.locals = { grant: { id: 'g123' } };
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
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(2);
        expect(request.oauth2.locals.grant.id).to.equal('g123');
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
    
    describe('based on client, user, scope, and type, authorization request, and transaction locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.service.name !== 'Contacts') { return done(new Error('incorrect locals argument')) };
          
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
            req.oauth2.locals = { service: { name: 'Contacts' } };
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
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(1);
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
    
    describe('based on client, user, scope, and type, authorization request, and transaction locals, that supplies additional locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.service.name !== 'Contacts') { return done(new Error('incorrect locals argument')) };
          
          return done(null, true, { scope: 'profile email' }, { ip: '127.0.0.1' });
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
            req.oauth2.locals = { service: { name: 'Contacts' } };
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
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(2);
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
        expect(request.oauth2.locals.ip).to.equal('127.0.0.1');
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });

    describe('based on complete transaction', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(txn, done) {
          if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (txn.req.scope !== 'email') { return done(new Error('incorrect scope argument')); }
          if (txn.req.type !== 'code') { return done(new Error('incorrect type argument')); }
          if (txn.req.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (txn.locals.service.name !== 'Contacts') { return done(new Error('incorrect locals argument')) };
          
          return done(null, true, { scope: 'profile email' }, { ip: '127.0.0.1' });
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
            req.oauth2.locals = { service: { name: 'Contacts' } };
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
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(2);
        expect(request.oauth2.locals.service.name).to.equal('Contacts');
        expect(request.oauth2.locals.ip).to.equal('127.0.0.1');
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
    
    describe('encountering an error', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, done) {
          return done(new Error('something went wrong while checking immediate status'));
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while checking immediate status');
      });
      
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });
      
      it('should not set response on transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.undefined;
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
      
      it('should not remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
        expect(Object.keys(request.session['authorize']['abc123'])).to.have.length(1);
        expect(request.session['authorize']['abc123'].protocol).to.equal('oauth2');
      });
    });
    
    describe('encountering an exception', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, done) {
          throw new Error('something was thrown while checking immediate status');
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something was thrown while checking immediate status');
      });
      
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u123');
        expect(request.oauth2.user.username).to.equal('bob');
      });
      
      it('should not set response on transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.undefined;
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
      
      it('should not remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
        expect(Object.keys(request.session['authorize']['abc123'])).to.have.length(1);
        expect(request.session['authorize']['abc123'].protocol).to.equal('oauth2');
      });
    });
    
    describe('encountering an error while responding to request', function() {
      var server, request, response, err;

      before(function() {
        server = new Server();
        
        server.grant('code', 'response', function(txn, res, next) {
          return next(new Error('something went wrong while sending response'));
        });
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
            req.oauth2.req = { type: 'code', scope: 'email', audience: 'https://api.example.com/' };
          })
          .res(function(res) {
            response = res;
          })
          .next(function(e) {
            err = e;
            done();
          })
          .end(function(){})
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while sending response');
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
      
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
      });
      
      it('should remove transaction from session after calling end', function() {
        response.end();
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
    
    describe('handling authorization request with unsupported response type', function() {
      var request, response, err;

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
            req.oauth2.req = { type: 'foo', scope: 'email', audience: 'https://api.example.com/' };
          })
          .res(function(res) {
            response = res;
          })
          .next(function(e) {
            err = e;
            done();
          })
          .end(function(){})
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unsupported response type: foo');
        expect(err.code).to.equal('unsupported_response_type');
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
      
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
      });
      
      it('should remove transaction from session after calling end', function() {
        response.end();
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
  });
  
  describe('immediate response with complete callback', function() {
    var server;
    
    before(function() {
      server = new Server();
      server.grant('code', 'response', function(txn, res, complete, next) {
        if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        if (txn.res.allow !== true) { return done(new Error('incorrect ares argument')); }
        if (txn.res.scope !== 'profile email') { return done(new Error('incorrect ares argument')); }
        
        complete(function(err) {
          if (err) { return next(err); }
          return res.redirect(txn.redirectURI);
        });
      });
    });
  
    describe('based on transaction', function() {
      var immediate, complete, request, response, err;

      before(function() {
        immediate = function(client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, true, { scope: 'profile email' });
        };
      });
      
      before(function() {
        complete = function(req, txn, done) {
          if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        
          req.__federated_to__ = {};
          req.__federated_to__.client = txn.client;
          return done(null);
        };
      });

      before(function(done) {
        chai.connect.use('express', resume(server, immediate, complete))
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
      
      it('should complete transaction', function() {
        expect(request.__federated_to__).to.be.an('object');
        expect(request.__federated_to__.client).to.deep.equal(request.oauth2.client);
        expect(request.__federated_to__.client.id).to.equal('1234');
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
      
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
      
      it('should flag req.end as proxied', function() {
        expect(request.oauth2._endProxied).to.be.true;
      });
    });
    
    describe('without complete callback', function() {
      var immediate, complete, request, response, err;

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
      
      it('should flag req.end as proxied', function() {
        expect(request.oauth2._endProxied).to.be.true;
      });
    });
    
    describe('encountering an error completing transaction', function() {
      var immediate, complete, request, response, err;

      before(function() {
        immediate = function(client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, true, { scope: 'profile email' });
        };
      });
      
      before(function() {
        complete = function(req, txn, done) {
          return done(new Error('failed to complete transaction'));
        };
      });

      before(function(done) {
        chai.connect.use('express', resume(server, immediate, complete))
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
          .res(function(res) {
            response = res;
          })
          .next(function(e) {
            err = e;
            done();
          })
          .end(function(){})
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('failed to complete transaction');
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
      
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
      });
      
      it('should remove transaction from session after calling end', function() {
        response.end();
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
  });
  
  describe('immediate response using non-legacy transaction store', function() {
    var server, immediate;
    
    before(function() {
      var MockStore = require('../mock/store');
      server = new Server({ store: new MockStore() });
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
      
      it('should remove transaction', function() {
        expect(request.__mock_store__.removed).to.equal('abc123');
      });
      
      it('should flag req.end as proxied', function() {
        expect(request.oauth2._endProxied).to.be.true;
      });
    });
  });
  
  
  describe('non-immediate response', function() {
    
    describe('using legacy transaction store', function() {
      var server, immediate;
      
      before(function() {
        server = new Server();
        server.serializeClient(function(client, done) {
          return done(null, client.id);
        });
      });
      
      describe('based on client and user', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
            return done(null, false);
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
            .next(function(e) {
              err = e;
              done();
            })
            .dispatch();
        });
    
        it('should not error', function() {
          expect(err).to.be.undefined;
        });
        
        it('should add transaction', function() {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.undefined;
          expect(request.oauth2.locals).to.be.undefined;
        });
    
        it('should update transaction in session', function() {
          expect(request.oauth2.transactionID).to.equal('abc123');
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('1234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.scope).to.equal('email');
          expect(request.session['authorize'][tid].info).to.be.undefined;
          expect(request.session['authorize'][tid].locals).to.be.undefined;
        });
      });
      
      describe('based on client and user, with result that clears previous info', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
            return done(null, false);
          };
        });

        before(function(done) {
          chai.connect.use('express', resume(server, immediate))
            .req(function(req) {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s'};
              req.session = {};
              req.session['authorize'] = {};
              req.session['authorize']['abc123'] = { protocol: 'oauth2', info: { foo: 'bar' } };
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
              req.oauth2.info = { foo: 'bar' };
            })
            .next(function(e) {
              err = e;
              done();
            })
            .dispatch();
        });
    
        it('should not error', function() {
          expect(err).to.be.undefined;
        });
        
        it('should add transaction', function() {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.undefined;
          expect(request.oauth2.locals).to.be.undefined;
        });
    
        it('should update transaction in session', function() {
          expect(request.oauth2.transactionID).to.equal('abc123');
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('1234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.scope).to.equal('email');
          expect(request.session['authorize'][tid].info).to.be.undefined;
          expect(request.session['authorize'][tid].locals).to.be.undefined;
        });
      });
      
      describe('based on client, user, and scope, with result that supplies info', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          
            return done(null, false, { scope: 'read', confidential: true });
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
            .next(function(e) {
              err = e;
              done();
            })
            .dispatch();
        });
    
        it('should not error', function() {
          expect(err).to.be.undefined;
        });
        
        it('should add transaction', function() {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.undefined;
        });
    
        it('should update transaction in session', function() {
          expect(request.oauth2.transactionID).to.equal('abc123');
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('1234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.scope).to.equal('email');
          expect(request.session['authorize'][tid].info.scope).to.equal('read');
          expect(request.session['authorize'][tid].info.confidential).to.equal(true);
          expect(request.session['authorize'][tid].locals).to.be.undefined;
        });
      });
      
      describe('based on client, user, and scope, with result that supplies overridden info', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          
            return done(null, false, { scope: 'read', confidential: true });
          };
        });

        before(function(done) {
          chai.connect.use('express', resume(server, immediate))
            .req(function(req) {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s'};
              req.session = {};
              req.session['authorize'] = {};
              req.session['authorize']['abc123'] = { protocol: 'oauth2', info: { foo: 'bar' } };
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
              req.oauth2.info = { foo: 'bar' };
            })
            .next(function(e) {
              err = e;
              done();
            })
            .dispatch();
        });
    
        it('should not error', function() {
          expect(err).to.be.undefined;
        });
        
        it('should add transaction', function() {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.undefined;
        });
    
        it('should update transaction in session', function() {
          expect(request.oauth2.transactionID).to.equal('abc123');
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('1234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.scope).to.equal('email');
          expect(request.session['authorize'][tid].info.scope).to.equal('read');
          expect(request.session['authorize'][tid].info.confidential).to.equal(true);
          expect(request.session['authorize'][tid].locals).to.be.undefined;
        });
      });
      
      describe('based on client, user, and scope, with result that supplies info and locals', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          
            return done(null, false, { scope: 'read', confidential: true }, { beep: 'boop' });
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
            .next(function(e) {
              err = e;
              done();
            })
            .dispatch();
        });
    
        it('should not error', function() {
          expect(err).to.be.undefined;
        });
        
        it('should add transaction', function() {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.an('object');
          expect(Object.keys(request.oauth2.locals)).to.have.length(1);
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.beep).to.equal('boop');
        });
    
        it('should update transaction in session', function() {
          expect(request.oauth2.transactionID).to.equal('abc123');
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('1234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.scope).to.equal('email');
          expect(request.session['authorize'][tid].info.scope).to.equal('read');
          expect(request.session['authorize'][tid].info.confidential).to.equal(true);
          expect(request.session['authorize'][tid].locals).to.be.undefined;
        });
      });
      
      describe('based on client, user, and scope, with result that supplies info and additional locals', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          
            return done(null, false, { scope: 'read', confidential: true }, { beep: 'boop' });
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
              req.oauth2.locals = { service: { name: 'Contacts' } };
            })
            .next(function(e) {
              err = e;
              done();
            })
            .dispatch();
        });
    
        it('should not error', function() {
          expect(err).to.be.undefined;
        });
        
        it('should add transaction', function() {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.an('object');
          expect(Object.keys(request.oauth2.locals)).to.have.length(2);
          expect(request.oauth2.locals.service.name).to.equal('Contacts');
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.beep).to.equal('boop');
        });
    
        it('should update transaction in session', function() {
          expect(request.oauth2.transactionID).to.equal('abc123');
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('1234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.scope).to.equal('email');
          expect(request.session['authorize'][tid].info.scope).to.equal('read');
          expect(request.session['authorize'][tid].info.confidential).to.equal(true);
          expect(request.session['authorize'][tid].locals).to.be.undefined;
        });
      });
    });
    
    describe('using non-legacy transaction store', function() {
      var server, immediate;
      
      before(function() {
        var MockStore = require('../mock/store');
        server = new Server({ store: new MockStore() });
      });
      
      describe('based on client, user, and scope, with result that supplies info and locals', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'email') { return done(new Error('incorrect scope argument')); }
          
            return done(null, false, { scope: 'read', confidential: true }, { beep: 'boop' });
          };
        });

        before(function(done) {
          chai.connect.use('express', resume(server, immediate))
            .req(function(req) {
              request = req;
              req.body = { code: '832076', _xsrf: '3ndukf8s'};
              req.user = { id: 'u123', username: 'bob' };
              req.oauth2 = {};
              req.oauth2.transactionID = 'abc123';
              req.oauth2.client = { id: '1234', name: 'Example' };
              req.oauth2.redirectURI = 'http://example.com/auth/callback';
              req.oauth2.req = { type: 'code', scope: 'email' };
            })
            .next(function(e) {
              err = e;
              done();
            })
            .dispatch();
        });
    
        it('should not error', function() {
          expect(err).to.be.undefined;
        });
        
        it('should add transaction', function() {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.res).to.be.undefined;
          expect(request.oauth2.info).to.be.an('object');
          expect(Object.keys(request.oauth2.info)).to.have.length(2);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.an('object');
          expect(Object.keys(request.oauth2.locals)).to.have.length(1);
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.beep).to.equal('boop');
        });
    
        it('should reserialize transaction', function() {
          expect(request.oauth2.transactionID).to.equal('mocktxn-1u');
          expect(request.__mock_store__.uh).to.equal('abc123');
          expect(request.__mock_store__.utxn).to.be.an('object');
          expect(request.__mock_store__.utxn.client.id).to.equal('1234');
          expect(request.__mock_store__.utxn.redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.__mock_store__.utxn.req.type).to.equal('code');
          expect(request.__mock_store__.utxn.req.scope).to.equal('email');
          expect(request.__mock_store__.utxn.user.id).to.equal('u123');
          expect(request.__mock_store__.utxn.info.scope).to.equal('read');
          expect(request.__mock_store__.utxn.info.confidential).to.equal(true);
          expect(request.__mock_store__.utxn.locals.beep).to.equal('boop');
        });
      });
    });
    
    describe('encountering an error while serializing client', function() {
      var server, immediate, request, err;

      before(function() {
        server = new Server();
        server.serializeClient(function(client, done) {
          return done(new Error('something went wrong while serializing client'));
        });
      });

      before(function() {
        immediate = function(client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        
          return done(null, false);
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
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
  
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while serializing client');
      });
      
      it('should leave transaction', function() {
        expect(request.oauth2).to.be.an('object');
      });
  
      it('should leave transaction in session', function() {
        expect(request.oauth2.transactionID).to.equal('abc123');
        var tid = request.oauth2.transactionID;
        expect(request.session['authorize'][tid]).to.be.an('object');
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
