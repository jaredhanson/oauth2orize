/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true, sub: true */

var chai = require('chai')
  , authorization = require('../../lib/middleware/authorization')
  , Server = require('../../lib/server');


describe('authorization', function() {
  
  describe('immediate response', function() {
    var server, validate, immediate;
    
    before(function() {
      server = new Server();
  
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri'],
          scope: req.query['scope']
        };
      });
      server.grant('code', 'response', function(txn, res, next) {
        if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        if (txn.res.allow !== true) { return done(new Error('incorrect ares argument')); }
        if (txn.res.scope !== 'read') { return done(new Error('incorrect ares argument')); }
        
        return res.redirect(txn.redirectURI);
      });
      
      server.grant('*', function(req) {
        return {
          audience: req.query['audience']
        };
      });
    });
    
    before(function() {
      validate = function(clientID, redirectURI, done) {
        return done(null, { id: clientID }, 'http://example.com/auth/callback');
      };
    });
    
    before(function() {
      immediate = function(client, user, done) {
        if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        
        return done(null, true, { scope: 'read' });
      };
    });
  
    describe('based on client and user', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, true, { scope: 'read' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
            req.user = { id: 'u123' };
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
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
    
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
    
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
  
    describe('based on client, user, and scope', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          
          return done(null, true, { scope: 'read' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile' };
            req.session = {};
            req.user = { id: 'u123' };
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
  
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
  
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
  
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
    describe('based on client, user, and scope, with result that supplies locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          
          return done(null, true, { scope: 'read' }, { beep: 'boop' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile' };
            req.session = {};
            req.user = { id: 'u123' };
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
  
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
  
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals.beep).to.equal('boop');
      });
  
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
    describe('based on client, user, scope, and type', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          
          return done(null, true, { scope: 'read' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile' };
            req.session = {};
            req.user = { id: 'u123' };
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
  
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
  
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
  
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
  
    describe('based on client, user, scope, type, and authorization request', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          
          return done(null, true, { scope: 'read' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile', audience: 'https://api.example.com/' };
            req.session = {};
            req.user = { id: 'u123' };
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
  
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
  
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
  
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
    describe('based on client, user, scope, type, authorization request, and locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals !== undefined) { return done(new Error('incorrect locals argument')); }
          
          return done(null, true, { scope: 'read' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile', audience: 'https://api.example.com/' };
            req.session = {};
            req.user = { id: 'u123' };
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
  
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
  
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
  
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });

    describe('based on client, user, scope, type, authorization request, and request locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.ip !== '123.45.67.890') { return done(new Error('incorrect locals argument')); }

          return done(null, true, { scope: 'read' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile', audience: 'https://api.example.com/' };
            req.session = {};
            req.user = { id: 'u123' };
            req.locals = { ip: '123.45.67.890' };
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
  
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
  
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(1);
        expect(request.oauth2.locals.ip).to.equal('123.45.67.890');
      });
  
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
    describe('based on client, user, scope, type, authorization request, and request locals, that supplies additional locals', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(client, user, scope, type, areq, locals, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          if (type !== 'code') { return done(new Error('incorrect type argument')); }
          if (areq.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (locals.ip !== '123.45.67.890') { return done(new Error('incorrect locals argument')); }

          return done(null, true, { scope: 'read' }, { beep: 'boop' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile', audience: 'https://api.example.com/' };
            req.session = {};
            req.user = { id: 'u123' };
            req.locals = { ip: '123.45.67.890' };
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
  
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
  
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(2);
        expect(request.oauth2.locals.ip).to.equal('123.45.67.890');
        expect(request.oauth2.locals.beep).to.equal('boop');
      });
  
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });

    describe('based on complete transaction', function() {
      var immediate, request, response, err;

      before(function() {
        immediate = function(txn, done) {
          if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          if (txn.req.scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          if (txn.req.type !== 'code') { return done(new Error('incorrect type argument')); }
          if (txn.req.audience !== 'https://api.example.com/') { return done(new Error('incorrect areq argument')); }
          if (txn.locals.ip !== '123.45.67.890') { return done(new Error('incorrect locals argument')); }

          return done(null, true, { scope: 'read' }, { beep: 'boop' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile', audience: 'https://api.example.com/' };
            req.session = {};
            req.user = { id: 'u123' };
            req.locals = { ip: '123.45.67.890' };
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
  
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
  
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.an('object');
        expect(Object.keys(request.oauth2.locals)).to.have.length(2);
        expect(request.oauth2.locals.ip).to.equal('123.45.67.890');
        expect(request.oauth2.locals.beep).to.equal('boop');
      });
  
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
  
    describe('encountering an error', function() {
      var immediate, request, err;

      before(function() {
        immediate = function(client, user, done) {
          return done(new Error('something went wrong while checking immediate status'));
        };
      });

      before(function(done) {
        chai.connect.use(authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
            req.user = { id: 'u123' };
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
    
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.undefined;
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
    
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
    describe('encountering an exception', function() {
      var immediate, request, err;

      before(function() {
        immediate = function(client, user, done) {
          throw new Error('something was thrown while checking immediate status');
        };
      });

      before(function(done) {
        chai.connect.use(authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
            req.user = { id: 'u123' };
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
    
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.undefined;
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
    
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
  
    describe('encountering an error while responding to request', function() {
      var server, request, err;

      before(function() {
        server = new Server();
  
        server.grant('code', function(req) {
          return {
            clientID: req.query['client_id'],
            redirectURI: req.query['redirect_uri'],
            scope: req.query['scope']
          };
        });
        server.grant('code', 'response', function(txn, res, next) {
          return next(new Error('something went wrong while sending response'));
        });
      });

      before(function(done) {
        chai.connect.use(authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
            req.user = { id: 'u123' };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while sending response');
      });
    
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
      });
    
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
  
    describe('unable to respond to request', function() {
      var server, request, err;

      before(function() {
        server = new Server();
  
        server.grant('foo', function(req) {
          return {
            clientID: req.query['client_id'],
            redirectURI: req.query['redirect_uri'],
            scope: req.query['scope']
          };
        });
      });

      before(function(done) {
        chai.connect.use(authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'foo', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
            req.user = { id: 'u123' };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Unsupported response type: foo');
      });
    
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
      });
    
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
  });
  
  describe('non-immediate response', function() {
    
    describe('using legacy transaction store', function() {
      var server, validate, immediate;
    
      before(function() {
        server = new Server();
        server.serializeClient(function(client, done) {
          return done(null, client.id);
        });
  
        server.grant('code', function(req) {
          return {
            clientID: req.query['client_id'],
            redirectURI: req.query['redirect_uri'],
            scope: req.query['scope']
          };
        });
      });
    
      before(function() {
        validate = function(clientID, redirectURI, done) {
          return done(null, { id: clientID }, 'http://example.com/auth/callback');
        };
      });
    
      describe('based on client and user', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, done) {
            if (client.id !== '2234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            
            return done(null, false);
          };
        });

        before(function(done) {
          chai.connect.use(authorization(server, validate, immediate))
            .req(function(req) {
              request = req;
              req.query = { response_type: 'code', client_id: '2234', redirect_uri: 'http://example.com/auth/callback' };
              req.session = {};
              req.user = { id: 'u123' };
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
    
        it('should store transaction in session', function() {
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('2234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.clientID).to.equal('2234');
          expect(request.session['authorize'][tid].req.redirectURI).to.equal('http://example.com/auth/callback');
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
            if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          
            return done(null, false, { scope: 'read', confidential: true });
          };
        });
        
        before(function(done) {
          chai.connect.use('express', authorization(server, validate, immediate))
            .req(function(req) {
              request = req;
              req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile' };
              req.session = {};
              req.user = { id: 'u123' };
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
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.locals).to.be.undefined;
        });
  
        it('should store transaction in session', function() {
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('1234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.clientID).to.equal('1234');
          expect(request.session['authorize'][tid].req.redirectURI).to.equal('http://example.com/auth/callback');
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
            if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          
            return done(null, false, { scope: 'read', confidential: true }, { beep: 'boop' });
          };
        });

        before(function(done) {
          chai.connect.use('express', authorization(server, validate, immediate))
            .req(function(req) {
              request = req;
              req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile' };
              req.session = {};
              req.user = { id: 'u123' };
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
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.beep).to.equal('boop');
        });
  
        it('should store transaction in session', function() {
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('1234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.clientID).to.equal('1234');
          expect(request.session['authorize'][tid].req.redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].info.confidential).to.equal(true);
          expect(request.session['authorize'][tid].info.scope).to.equal('read');
          expect(request.session['authorize'][tid].locals).to.be.undefined;
        });
      });
      
      describe('based on client, user, and scope, with result that supplies info and additional locals', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          
            return done(null, false, { scope: 'read', confidential: true }, { beep: 'boop' });
          };
        });

        before(function(done) {
          chai.connect.use('express', authorization(server, validate, immediate))
            .req(function(req) {
              request = req;
              req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile' };
              req.session = {};
              req.user = { id: 'u123' };
              req.locals = { ip: '123.45.67.890' };
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
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(Object.keys(request.oauth2.locals)).to.have.length(2);
          expect(request.oauth2.locals.ip).to.equal('123.45.67.890');
          expect(request.oauth2.locals.beep).to.equal('boop');
        });
  
        it('should store transaction in session', function() {
          var tid = request.oauth2.transactionID;
          expect(request.session['authorize'][tid]).to.be.an('object');
          expect(request.session['authorize'][tid].protocol).to.equal('oauth2');
          expect(request.session['authorize'][tid].client).to.equal('1234');
          expect(request.session['authorize'][tid].redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].req.type).to.equal('code');
          expect(request.session['authorize'][tid].req.clientID).to.equal('1234');
          expect(request.session['authorize'][tid].req.redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.session['authorize'][tid].info.confidential).to.equal(true);
          expect(request.session['authorize'][tid].info.scope).to.equal('read');
          expect(request.session['authorize'][tid].locals).to.be.undefined;
        });
      });
      
    });
    
    describe('using non-legacy transaction store', function() {
      var server, validate, immediate;
    
      before(function() {
        var MockStore = require('../mock/store');
        server = new Server({ store: new MockStore() });
  
        server.grant('code', function(req) {
          return {
            clientID: req.query['client_id'],
            redirectURI: req.query['redirect_uri'],
            scope: req.query['scope']
          };
        });
      });
    
      before(function() {
        validate = function(clientID, redirectURI, done) {
          return done(null, { id: clientID }, 'http://example.com/auth/callback');
        };
      });
      
      describe('based on client, user, and scope, with result that supplies info and locals', function() {
        var immediate, request, err;

        before(function() {
          immediate = function(client, user, scope, done) {
            if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
            if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
            if (scope !== 'profile') { return done(new Error('incorrect scope argument')); }
          
            return done(null, false, { scope: 'read', confidential: true }, { beep: 'boop' });
          };
        });

        before(function(done) {
          chai.connect.use('express', authorization(server, validate, immediate))
            .req(function(req) {
              request = req;
              req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'profile' };
              req.user = { id: 'u123' };
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
          expect(request.oauth2.info.confidential).to.equal(true);
          expect(request.oauth2.info.scope).to.equal('read');
          expect(request.oauth2.locals).to.be.an('object');
          expect(request.oauth2.locals.beep).to.equal('boop');
        });
        
        it('should serialize transaction', function() {
          expect(request.__mock_store__.txn).to.be.an('object');
          expect(Object.keys(request.__mock_store__.txn)).to.have.length(7);
          expect(request.__mock_store__.txn.transactionID).to.equal('mocktxn-1');
          expect(request.__mock_store__.txn.client.id).to.equal('1234');
          expect(request.__mock_store__.txn.redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.__mock_store__.txn.req.type).to.equal('code');
          expect(request.__mock_store__.txn.req.clientID).to.equal('1234');
          expect(request.__mock_store__.txn.req.redirectURI).to.equal('http://example.com/auth/callback');
          expect(request.__mock_store__.txn.user.id).to.equal('u123');
          expect(request.__mock_store__.txn.info.confidential).to.equal(true);
          expect(request.__mock_store__.txn.info.scope).to.equal('read');
          expect(request.__mock_store__.txn.locals.beep).to.equal('boop');
        });
      });
    });
    
  });
  
  
  describe('immediate response with complete callback', function() {
    var server, validate;
    
    before(function() {
      server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri'],
          scope: req.query['scope']
        };
      });
      server.grant('code', 'response', function(txn, res, complete, next) {
        if (txn.client.id !== '1234') { return done(new Error('incorrect client argument')); }
        if (txn.user.id !== 'u123') { return done(new Error('incorrect user argument')); }
        if (txn.res.allow !== true) { return done(new Error('incorrect ares argument')); }
        if (txn.res.scope !== 'read') { return done(new Error('incorrect ares argument')); }
        
        complete(function(err) {
          if (err) { return next(err); }
          return res.redirect(txn.redirectURI);
        });
      });
    });
    
    before(function() {
      validate = function(clientID, redirectURI, done) {
        return done(null, { id: clientID }, 'http://example.com/auth/callback');
      };
    });
  
    describe('based on transaction', function() {
      var immediate, complete, request, response, err;

      before(function() {
        immediate = function(client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, true, { scope: 'read' });
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
        chai.connect.use('express', authorization(server, validate, immediate, complete))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
            req.user = { id: 'u123' };
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
      
      it('should complete transaction', function() {
        expect(request.__federated_to__).to.be.an('object');
        expect(request.__federated_to__.client).to.deep.equal(request.oauth2.client);
        expect(request.__federated_to__.client.id).to.equal('1234');
      });
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
    
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
    
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
    describe('without complete callback', function() {
      var immediate, complete, request, response, err;

      before(function() {
        immediate = function(client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, true, { scope: 'read' });
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
            req.user = { id: 'u123' };
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
    
      it('should respond', function() {
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback');
      });
    
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
    
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
    describe('encountering an error completing transaction', function() {
      var immediate, complete, request, response, err;

      before(function() {
        immediate = function(client, user, done) {
          if (client.id !== '1234') { return done(new Error('incorrect client argument')); }
          if (user.id !== 'u123') { return done(new Error('incorrect user argument')); }
          
          return done(null, true, { scope: 'read' });
        };
      });
      
      before(function() {
        complete = function(req, txn, done) {
          return done(new Error('failed to complete transaction'));
        };
      });

      before(function(done) {
        chai.connect.use('express', authorization(server, validate, immediate, complete))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
            req.user = { id: 'u123' };
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
    
      it('should add transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.equal(true);
        expect(request.oauth2.res.scope).to.equal('read');
        expect(request.oauth2.info).to.be.undefined;
        expect(request.oauth2.locals).to.be.undefined;
      });
    
      it('should not store transaction in session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
        expect(request.session['authorize']).to.be.undefined;
      });
    });
  });
  
});
