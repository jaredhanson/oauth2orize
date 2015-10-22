/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true, sub: true */

var chai = require('chai')
  , authorization = require('../../lib/middleware/authorization')
  , Server = require('../../lib/server');


describe('authorization', function() {
  
  var server = new Server();
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
  server.grant('code', 'response', function(txn, res, next) {
    if ((txn.client.id == '1234' || txn.client.id == '2234') && txn.user.id == 'u123' && txn.res.allow === true && txn.res.scope === 'read') {
      return res.redirect(txn.redirectURI);
    }
    return next(new Error('something went wrong while sending response'));
  });
  
  server.grant('foo', function(req) {
    return {
      clientID: req.query['client_id'],
      redirectURI: req.query['redirect_uri'],
      scope: req.query['scope']
    };
  });
  
  function validate(clientID, redirectURI, done) {
    return done(null, { id: clientID }, 'http://example.com/auth/callback');
  }
  
  function immediate(client, user, done) {
    if (client.id == '1234' && user.id == 'u123') {
      return done(null, true, { scope: 'read' });
    } else if (client.id == '2234' && user.id == 'u123') {
      return done(null, false);
    } else if (client.id == 'T234' && user.id == 'u123') {
      throw new Error('something was thrown while checking immediate status');
    } else if (client.id == 'ER34' && user.id == 'u123') {
      return done(null, true, { scope: 'read' });
    }
    return done(new Error('something went wrong while checking immediate status'));
  }
  
  describe('handling a request that is immediately authorized', function() {
    var request, response, err;

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
    });
    
    it('should not store transaction in session', function() {
      expect(request.session['authorize']).to.be.undefined;
    });
  });
  
  describe('handling a request that is not immediately authorized', function() {
    var request, err;

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
    });
  });
  
  describe('handling a request that encounters an error while checking immediate status', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate, immediate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: 'X234', redirect_uri: 'http://example.com/auth/callback' };
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
    });
    
    it('should not store transaction in session', function() {
      expect(request.session['authorize']).to.be.undefined;
    });
  });
  
  describe('handling a request that throws an error while checking immediate status', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate, immediate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: 'T234', redirect_uri: 'http://example.com/auth/callback' };
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
    });
    
    it('should not store transaction in session', function() {
      expect(request.session['authorize']).to.be.undefined;
    });
  });
  
  describe('handling a request that is immediately authorized but encounters an error while responding', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate, immediate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: 'ER34', redirect_uri: 'http://example.com/auth/callback' };
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
      expect(request.session['authorize']).to.be.undefined;
    });
  });
  
  describe('handling a request that is immediately authorized but unable to respond', function() {
    var request, err;

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
      expect(request.session['authorize']).to.be.undefined;
    });
  });
  
  describe('immediate callback with scope', function() {
    describe('handling a request that is immediately authorized', function() {
      var request, response, err;

      function immediate(client, user, scope, done) {
        if (client.id == '1234' && user.id == 'u123' && scope == 'profile') {
          return done(null, true, { scope: 'read' });
        }
        return done(new Error('something went wrong while checking immediate status'));
      }

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
      });
    
      it('should not store transaction in session', function() {
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
    describe('handling a request that is not immediately authorized', function() {
      var request, response, err;

      function immediate(client, user, scope, done) {
        if (client.id == '1234' && user.id == 'u123' && scope == 'profile') {
          return done(null, false, { scope: 'read', format: 'application/jwt' });
        }
        return done(new Error('something went wrong while checking immediate status'));
      }

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
        expect(request.oauth2.info.format).to.equal('application/jwt');
        expect(request.oauth2.info.scope).to.equal('read');
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
        expect(request.session['authorize'][tid].info.format).to.equal('application/jwt');
        expect(request.session['authorize'][tid].info.scope).to.equal('read');
      });
    });
  });
  
  describe('immediate callback with scope and locals', function() {
    describe('handling a request that is immediately authorized', function() {
      var request, response, err;

      function immediate(client, user, scope, done) {
        if (client.id == '1234' && user.id == 'u123' && scope == 'profile') {
          return done(null, true, { scope: 'read' }, { beep: 'boop' });
        }
        return done(new Error('something went wrong while checking immediate status'));
      }

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
        expect(request.session['authorize']).to.be.undefined;
      });
    });
    
    describe('handling a request that is not immediately authorized', function() {
      var request, response, err;

      function immediate(client, user, scope, done) {
        if (client.id == '1234' && user.id == 'u123' && scope == 'profile') {
          return done(null, false, { scope: 'read', format: 'application/jwt' }, { beep: 'boop' });
        }
        return done(new Error('something went wrong while checking immediate status'));
      }

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
        expect(request.oauth2.info.format).to.equal('application/jwt');
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
        expect(request.session['authorize'][tid].info.format).to.equal('application/jwt');
        expect(request.session['authorize'][tid].info.scope).to.equal('read');
        expect(request.session['authorize'][tid].locals).to.be.undefined;
      });
    });
  });
  
  describe('immediate callback with scope and type', function() {
    describe('handling a request that is immediately authorized', function() {
      var request, response, err;

      function immediate(client, user, scope, type, done) {
        if (client.id == '1234' && user.id == 'u123' && scope == 'profile' && type == 'code') {
          return done(null, true, { scope: 'read' });
        }
        return done(new Error('something went wrong while checking immediate status'));
      }

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
      });
    
      it('should not store transaction in session', function() {
        expect(request.session['authorize']).to.be.undefined;
      });
    });
  });
  
  describe('immediate callback with scope and type and extensions', function() {
    describe('handling a request that is immediately authorized', function() {
      var request, response, err;

      var server = new Server();
      server.grant('code', function(req) {
        return {
          clientID: req.query['client_id'],
          redirectURI: req.query['redirect_uri'],
          scope: req.query['scope']
        };
      });
      server.grant('code', 'response', function(txn, res, next) {
        if ((txn.client.id == '1234' || txn.client.id == '2234') && txn.user.id == 'u123' && txn.res.allow === true && txn.res.scope === 'read') {
          return res.redirect(txn.redirectURI);
        }
        return next(new Error('something went wrong while sending response'));
      });
      
      server.grant('*', function(req) {
        return {
          audience: req.query['audience']
        };
      });

      function immediate(client, user, scope, type, ext, done) {
        if (client.id == '1234' && user.id == 'u123' && scope == 'profile' && type == 'code' && ext.audience == 'https://api.example.com/') {
          return done(null, true, { scope: 'read' });
        }
        return done(new Error('something went wrong while checking immediate status'));
      }

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
      });
    
      it('should not store transaction in session', function() {
        expect(request.session['authorize']).to.be.undefined;
      });
    });
  });
  
});
