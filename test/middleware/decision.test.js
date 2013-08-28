var chai = require('chai')
  , decision = require('../../lib/middleware/decision')
  , Server = require('../../lib/server');


describe('decision', function() {
  
  var server = new Server();
  server.grant('code', 'response', function(txn, res, next) {
    if (txn.res.allow == false) { return res.redirect(txn.redirectURI + '?error=access_denied'); }
    if (txn.transactionID == 'abc123') { return res.redirect(txn.redirectURI + '?code=a1b1c1'); }
    return next(new Error('grant code failure'));
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
      chai.connect(decision(server))
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
      expect(request.oauth2.user).to.be.an('object')
      expect(request.oauth2.user.id).to.equal('u1234');
      expect(request.oauth2.user.username).to.equal('bob');
    });
    
    it('should set response on transaction', function() {
      expect(request.oauth2.res).to.be.an('object')
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
      chai.connect(decision(server))
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
      expect(request.oauth2.user).to.be.an('object')
      expect(request.oauth2.user.id).to.equal('u1234');
      expect(request.oauth2.user.username).to.equal('bob');
    });
    
    it('should set response on transaction', function() {
      expect(request.oauth2.res).to.be.an('object')
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
  
  describe('with parsing function', function() {
    var mw = decision(server, function(req, done) {
      done(null, { scope: req.query.scope });
    });
    
    describe('handling a user decision to allow access', function() {
      var request, response;

      before(function(done) {
        chai.connect(mw)
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
        expect(request.oauth2.user).to.be.an('object')
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object')
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
  
  describe('with parsing function that parses a request to deny access', function() {
    var mw = decision(server, function(req, done) {
      done(null, { allow: false });
    });
    
    describe('handling a user decision', function() {
      var request, response;

      before(function(done) {
        chai.connect(mw)
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
        expect(request.oauth2.user).to.be.an('object')
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object')
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
        chai.connect(mw)
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
        expect(request.oauth2.user).to.be.an('object')
        expect(request.oauth2.user.id).to.equal('u1234');
        expect(request.oauth2.user.username).to.equal('bob');
      });
    
      it('should set response on transaction', function() {
        expect(request.oauth2.res).to.be.an('object')
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
  
});

