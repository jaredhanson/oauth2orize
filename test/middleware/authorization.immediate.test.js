/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true, sub: true */

var chai = require('chai')
  , authorization = require('../../lib/middleware/authorization')
  , AuthorizationError = require('../../lib/errors/authorizationerror')
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

  server.grant('token', function (req) {
    return {
      clientID: req.query['client_id'],
      redirectURI: req.query['redirect_uri'],
      scope: req.query['scope'],
      immediate: req.query['immediate'] === 'true'
    };
  });
  server.grant('token', 'response', function(txn, res, next) {
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
    function immediate(client, user, scope, done) {
      if (client.id == '1234' && user.id == 'u123' && scope == 'profile') {
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
      });
    
      it('should not store transaction in session', function() {
        expect(request.session['authorize']).to.be.undefined;
      });
    });
  });

  describe('with immediate query flag and no user', function() {
    var err;

    function immediate(client, user, scope, done) {
      done(null, false);
    }

    before(function(done) {
      chai.connect.use(authorization(server, validate, immediate))
        .req(function(req) {
          req.query = { response_type: 'token', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', immediate: 'true' };
          req.session = {};
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error immediate_unsuccessful', function() {
      expect(err).to.be.instanceOf(AuthorizationError);
      expect(err.code).to.equal('immediate_unsuccessful');
    });

  });

  describe('with immediate query flag and with an user', function() {
    var err;

    function immediate(client, user, scope, done) {
      done(null, false);
    }

    before(function(done) {
      chai.connect.use(authorization(server, validate, immediate))
        .req(function(req) {
          req.query = { response_type: 'token', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', immediate: 'true' };
          req.session = {};
          req.user = { id: 'u123' };
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });

    it('should error immediate_unsuccessful', function() {
      expect(err).to.be.instanceOf(AuthorizationError);
      expect(err.code).to.equal('immediate_unsuccessful');
    });

  });


});
