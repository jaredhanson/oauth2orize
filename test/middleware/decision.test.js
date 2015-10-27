/* global describe, it, expect, before */
/* jshint expr: true, sub: true */

var chai = require('chai')
  , decision = require('../../lib/middleware/decision')
  , Server = require('../../lib/server');


describe('decision', function() {
  
  var server = new Server();
  server.grant('code', 'response', function(txn, res, next) {
    if (txn.res.allow === false) { return res.redirect(txn.redirectURI + '?error=access_denied'); }
    if (txn.transactionID == 'abc123') { return res.redirect(txn.redirectURI + '?code=a1b1c1'); }
    return next(new Error('something went wrong while handling response'));
  });
  
  it('should be named decision', function() {
    expect(decision(server).name).to.equal('decision');
  });
  
  it('should throw if constructed without a server argument', function() {
    expect(function() {
      decision();
    }).to.throw(TypeError, 'oauth2orize.decision middleware requires a server argument');
  });
  
  describe('handling a user decision to allow access', function() {
    var request, response;

    before(function(done) {
      chai.connect.use('express', decision(server))
        .req(function(req) {
          request = req;
          req.query = {};
          req.body = {};
          req.session = {};
          req.session['authorize'] = {};
          req.session['authorize']['abc123'] = { protocol: 'oauth2' };
          req.user = { id: 'u1234', username: 'bob' };
          req.oauth2 = {};
          req.oauth2.transactionID = 'abc123';
          req.oauth2.client = { id: 'c5678', name: 'Example' };
          req.oauth2.redirectURI = 'http://example.com/auth/callback';
          req.oauth2.req = { type: 'code', scope: 'email' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });
    
    it('should set user on transaction', function() {
      expect(request.oauth2.user).to.be.an('object');
      expect(request.oauth2.user.id).to.equal('u1234');
      expect(request.oauth2.user.username).to.equal('bob');
    });
    
    it('should set response on transaction', function() {
      expect(request.oauth2.res).to.be.an('object');
      expect(request.oauth2.res.allow).to.be.true;
    });
    
    it('should respond', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
    });
    
    it('should remove transaction from session', function() {
      expect(request.session['authorize']['abc123']).to.be.undefined;
    });
  });
  
  describe('handling a user decision to deny access', function() {
    var request, response;

    before(function(done) {
      chai.connect.use('express', decision(server))
        .req(function(req) {
          request = req;
          req.query = {};
          req.body = { cancel: 'Deny' };
          req.session = {};
          req.session['authorize'] = {};
          req.session['authorize']['abc123'] = { protocol: 'oauth2' };
          req.user = { id: 'u1234', username: 'bob' };
          req.oauth2 = {};
          req.oauth2.transactionID = 'abc123';
          req.oauth2.client = { id: 'c5678', name: 'Example' };
          req.oauth2.redirectURI = 'http://example.com/auth/callback';
          req.oauth2.req = { type: 'code', scope: 'email' };
        })
        .end(function(res) {
          response = res;
          done();
        })
        .dispatch();
    });
    
    it('should set user on transaction', function() {
      expect(request.oauth2.user).to.be.an('object');
      expect(request.oauth2.user.id).to.equal('u1234');
      expect(request.oauth2.user.username).to.equal('bob');
    });
    
    it('should set response on transaction', function() {
      expect(request.oauth2.res).to.be.an('object');
      expect(request.oauth2.res.allow).to.be.false;
    });
    
    it('should respond', function() {
      expect(response.statusCode).to.equal(302);
      expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=access_denied');
    });
    
    it('should remove transaction from session', function() {
      expect(request.session['authorize']['abc123']).to.be.undefined;
    });
  });
  
  describe('handling a user decision to allow access using unknown response type', function() {
    var request, response, err;

    before(function(done) {
      chai.connect.use(decision(server))
        .req(function(req) {
          request = req;
          req.query = {};
          req.body = {};
          req.session = {};
          req.session['authorize'] = {};
          req.session['authorize']['abc123'] = { protocol: 'oauth2' };
          req.user = { id: 'u1234', username: 'bob' };
          req.oauth2 = {};
          req.oauth2.transactionID = 'abc123';
          req.oauth2.client = { id: 'c5678', name: 'Example' };
          req.oauth2.redirectURI = 'http://example.com/auth/callback';
          req.oauth2.req = { type: 'foo', scope: 'email' };
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
      expect(request.oauth2.user.id).to.equal('u1234');
      expect(request.oauth2.user.username).to.equal('bob');
    });
    
    it('should set response on transaction', function() {
      expect(request.oauth2.res).to.be.an('object');
      expect(request.oauth2.res.allow).to.be.true;
    });
    
    it('should leave transaction in session', function() {
      expect(request.session['authorize']['abc123']).to.be.an('object');
    });
    
    it('should remove transaction from session after calling end', function() {
      response.end();
      expect(request.session['authorize']['abc123']).to.be.undefined;
    });
  });
  
  describe('encountering an error while responding with grant', function() {
    var request, response, err;

    before(function(done) {
      chai.connect.use(decision(server))
        .req(function(req) {
          request = req;
          req.query = {};
          req.body = {};
          req.session = {};
          req.session['authorize'] = {};
          req.session['authorize']['err123'] = { protocol: 'oauth2' };
          req.user = { id: 'u1234', username: 'bob' };
          req.oauth2 = {};
          req.oauth2.transactionID = 'err123';
          req.oauth2.client = { id: 'c5678', name: 'Example' };
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
      expect(err.message).to.equal('something went wrong while handling response');
    });
    
    it('should set user on transaction', function() {
      expect(request.oauth2.user).to.be.an('object');
      expect(request.oauth2.user.id).to.equal('u1234');
      expect(request.oauth2.user.username).to.equal('bob');
    });
    
    it('should set response on transaction', function() {
      expect(request.oauth2.res).to.be.an('object');
      expect(request.oauth2.res.allow).to.be.true;
    });
    
    it('should leave transaction in session', function() {
      expect(request.session['authorize']['err123']).to.be.an('object');
    });
    
    it('should remove transaction from session after calling end', function() {
      response.end();
      expect(request.session['authorize']['abc123']).to.be.undefined;
    });
  });
  
  describe('handling a request without a session', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(decision(server))
        .req(function(req) {
          request = req;
          req.query = {};
          req.body = {};
          req.user = { id: 'u1234', username: 'bob' };
          req.oauth2 = {};
          req.oauth2.transactionID = 'abc123';
          req.oauth2.client = { id: 'c5678', name: 'Example' };
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
      expect(err.message).to.equal('OAuth2orize requires session support. Did you forget app.use(express.session(...))?');
    });
    
    it('should not set user on transaction', function() {
      expect(request.oauth2.user).to.be.undefined;
    });
    
    it('should not set response on transaction', function() {
      expect(request.oauth2.res).to.be.undefined;
    });
  });
  
  describe('handling a request without a body', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(decision(server))
        .req(function(req) {
          request = req;
          req.query = {};
          req.session = {};
          req.session['authorize'] = {};
          req.session['authorize']['abc123'] = { protocol: 'oauth2' };
          req.user = { id: 'u1234', username: 'bob' };
          req.oauth2 = {};
          req.oauth2.transactionID = 'abc123';
          req.oauth2.client = { id: 'c5678', name: 'Example' };
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
      expect(err.message).to.equal('OAuth2orize requires body parsing. Did you forget app.use(express.bodyParser())?');
    });
    
    it('should not set user on transaction', function() {
      expect(request.oauth2.user).to.be.undefined;
    });
    
    it('should not set response on transaction', function() {
      expect(request.oauth2.res).to.be.undefined;
    });
    
    it('should leave transaction in session', function() {
      expect(request.session['authorize']['abc123']).to.be.an('object');
    });
  });
  
  describe('handling a request without a transaction', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(decision(server))
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
  
  describe('handling a request without transactions in session', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(decision(server))
        .req(function(req) {
          request = req;
          req.query = {};
          req.body = {};
          req.session = {};
          req.user = { id: 'u1234', username: 'bob' };
          req.oauth2 = {};
          req.oauth2.transactionID = 'abc123';
          req.oauth2.client = { id: 'c5678', name: 'Example' };
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
      expect(err.constructor.name).to.equal('ForbiddenError');
      expect(err.message).to.equal('Unable to load OAuth 2.0 transactions from session');
    });
    
    it('should not set user on transaction', function() {
      expect(request.oauth2.user).to.be.undefined;
    });
    
    it('should not set response on transaction', function() {
      expect(request.oauth2.res).to.be.undefined;
    });
  });
  
  describe('with parsing function', function() {
    var mw = decision(server, function(req, done) {
      done(null, { scope: req.query.scope });
    });
    
    describe('handling a user decision', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', mw)
          .req(function(req) {
            request = req;
            req.query = {};
            req.query.scope = 'no-email';
            req.body = {};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('no-email');
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
      });
    
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
  });
  
  describe('with parsing function that denies access', function() {
    var mw = decision(server, function(req, done) {
      done(null, { allow: false });
    });
    
    describe('handling a user decision', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', mw)
          .req(function(req) {
            request = req;
            req.query = {};
            req.query.scope = 'no-email';
            req.body = {};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.false;
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=access_denied');
      });
    
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
  });
  
  describe('with parsing function that errors', function() {
    var mw = decision(server, function(req, done) {
      done(new Error('something went wrong'));
    });
    
    describe('handling a user decision', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(mw)
          .req(function(req) {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
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
        expect(err.message).to.equal('something went wrong');
      });
    
      it('should not set user on transaction', function() {
        expect(request.oauth2.user).to.be.undefined;
      });
    
      it('should not set response on transaction', function() {
        expect(request.oauth2.res).to.be.undefined;
      });
    
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
      });
    });
  });
  
  describe('with parsing function that clears session', function() {
    var mw = decision(server, function(req, done) {
      req.session = {};
      done(null, { scope: req.query.scope });
    });
    
    describe('handling a user decision', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', mw)
          .req(function(req) {
            request = req;
            req.query = {};
            req.query.scope = 'no-email';
            req.body = {};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
        expect(request.oauth2.res.scope).to.equal('no-email');
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
      });
    
      it('should remain a cleared session', function() {
        expect(Object.keys(request.session).length).to.equal(0);
      });
    });
  });
  
  describe('with cancel field option', function() {
    var mw = decision(server, { cancelField: 'deny' });
    
    describe('handling a user decision to deny access', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', mw)
          .req(function(req) {
            request = req;
            req.query = {};
            req.body = { deny: 'Deny' };
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.false;
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error=access_denied');
      });
    
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
  });
  
  describe('with session key option', function() {
    var mw = decision(server, { sessionKey: 'oauth2orize' });
    
    describe('handling a user decision to allow access', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', mw)
          .req(function(req) {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session['oauth2orize'] = {};
            req.session['oauth2orize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
      });
    
      it('should remove transaction from session', function() {
        expect(request.session['oauth2orize']['abc123']).to.be.undefined;
      });
    });
  });
  
  describe('with user property option', function() {
    var mw = decision(server, { userProperty: 'other' });
    
    describe('handling a user decision to allow access', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', mw)
          .req(function(req) {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.other = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.transactionID = 'abc123';
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch();
      });
    
      it('should set user on transaction', function() {
        expect(request.oauth2.user).to.be.an('object');
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object');
        expect(request.oauth2.res.allow).to.be.true;
      });
    
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?code=a1b1c1');
      });
    
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
  });
  
});

