var chai = require('chai')
  , authorizationErrorHandler = require('../../lib/middleware/authorizationErrorHandler')
  , Server = require('../../lib/server');


describe('authorizationErrorHandler', function() {
  
  it('should be named token', function() {
    var server = new Server();
    expect(authorizationErrorHandler(server).name).to.equal('authorizationErrorHandler');
  });
  
  it('should throw if constructed without a server argument', function() {
    expect(function() {
      authorizationErrorHandler();
    }).to.throw(TypeError, 'oauth2orize.authorizationErrorHandler middleware requires a server argument');
  });
  
  describe('using legacy transaction store', function() {
    var server;
    
    before(function() {
      server = new Server();
      
      server.grant('code', 'error', function(err, txn, res, next) {
        if (txn.req.scope != 'email') { return next(new Error('incorrect transaction argument')); }
        return res.redirect(txn.redirectURI + '?error_description=' + err.message);
      });
      
      server.grant('fubar', 'error', function(err, txn, res, next) {
        return next(new Error('something else went wrong'));
      });
    });
    
    
    describe('handling an error', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', authorizationErrorHandler(server))
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
          .dispatch(new Error('something went wrong'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error_description=something went wrong');
      });
    
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.undefined;
      });
    });
    
    describe('handling an error when transaction has not been persisted', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', authorizationErrorHandler(server))
          .req(function(req) {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
            req.oauth2 = {};
            req.oauth2.client = { id: 'c5678', name: 'Example' };
            req.oauth2.redirectURI = 'http://example.com/auth/callback';
            req.oauth2.req = { type: 'code', scope: 'email' };
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error_description=something went wrong');
      });
    
      it('should not remove data from session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
      });
    });
    
    describe('handling an error where res.end has already been proxied', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', authorizationErrorHandler(server))
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
            req.oauth2._endProxied = true;
          })
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error_description=something went wrong');
      });
    
      it('should not remove transaction from session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
      });
    });
    
    describe('encountering an unsupported response type while handling an error', function() {
      var request, response, err;

      before(function(done) {
        chai.connect.use('express', authorizationErrorHandler(server))
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
            req.oauth2.req = { type: 'unsupported', scope: 'email' };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
      
      it('should preserve error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
    
    describe('encountering an error while handling an error', function() {
      var request, response, err;

      before(function(done) {
        chai.connect.use('express', authorizationErrorHandler(server))
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
            req.oauth2.req = { type: 'fubar', scope: 'email' };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
      
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something else went wrong');
      });
    });
    
    describe('handling a request that is not associated with a transaction', function() {
      var request, response, err;

      before(function(done) {
        chai.connect.use('express', authorizationErrorHandler(server))
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
          .dispatch(new Error('something went wrong'));
      });
      
      it('should preserve error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
      
      it('should not remove data from session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
      });
    });
  });
  
  describe('using non-legacy transaction store', function() {
    var server;
    
    before(function() {
      var MockStore = require('../mock/store');
      server = new Server({ store: new MockStore() });
      
      server.grant('code', 'error', function(err, txn, res, next) {
        if (txn.req.scope != 'email') { return next(new Error('incorrect transaction argument')); }
        return res.redirect(txn.redirectURI + '?error_description=' + err.message);
      });
    });
    
    describe('handling an error', function() {
      var request, response;

      before(function(done) {
        chai.connect.use('express', authorizationErrorHandler(server))
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
          .end(function(res) {
            response = res;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
      
      it('should respond', function() {
        expect(response.statusCode).to.equal(302);
        expect(response.getHeader('Location')).to.equal('http://example.com/auth/callback?error_description=something went wrong');
      });
    
      it('should remove transaction', function() {
        expect(request.__mock_store__.removed).to.equal('abc123');
      });
    });
  });
  
});
