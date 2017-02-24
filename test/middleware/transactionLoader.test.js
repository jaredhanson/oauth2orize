/* global describe, it, expect, before */
/* jshint expr: true, sub: true */

var chai = require('chai')
  , transactionLoader = require('../../lib/middleware/transactionLoader')
  , Server = require('../../lib/server');


describe('transactionLoader', function() {
  
  it('should be named transactionLoader', function() {
    var server = new Server();
    expect(transactionLoader(server).name).to.equal('transactionLoader');
  });

  it('should throw if constructed without a server argument', function() {
    expect(function() {
      transactionLoader();
    }).to.throw(TypeError, 'oauth2orize.transactionLoader middleware requires a server argument');
  });
  
  describe('using legacy transaction store', function() {
    var server;
  
    before(function() {
      server = new Server();
      server.deserializeClient(function(id, done) {
        if (id !== '1') { return done(new Error('incorrect id argument')); }
        return done(null, { id: id, name: 'Test' });
      });
    });
  
    describe('handling a request with transaction id in query', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
            req.query = { 'transaction_id': '1234' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize['1234'] = {
              client: '1',
              redirectURI: 'http://www.example.com/auth/callback',
              req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
            };
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
    
      it('should restore transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.equal('1234');
        expect(request.oauth2.client.id).to.equal('1');
        expect(request.oauth2.client.name).to.equal('Test');
        expect(request.oauth2.redirectURI).to.equal('http://www.example.com/auth/callback');
        expect(request.oauth2.req.redirectURI).to.equal('http://www.example.com/auth/callback');
        expect(request.oauth2.req.foo).to.equal('bar');
      });
    
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['1234']).to.be.an('object');
      });
    });
  
    describe('handling a request with transaction id in body', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
            req.body = { 'transaction_id': '1234' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize['1234'] = {
              client: '1',
              redirectURI: 'http://www.example.com/auth/callback',
              req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' },
              info: { beep: 'boop' }
            };
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
    
      it('should restore transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.equal('1234');
        expect(request.oauth2.client.id).to.equal('1');
        expect(request.oauth2.client.name).to.equal('Test');
        expect(request.oauth2.redirectURI).to.equal('http://www.example.com/auth/callback');
        expect(request.oauth2.req.redirectURI).to.equal('http://www.example.com/auth/callback');
        expect(request.oauth2.req.foo).to.equal('bar');
        expect(request.oauth2.info.beep).to.equal('boop');
      });
    
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['1234']).to.be.an('object');
      });
    });
    
    describe('handling a request with transaction already loaded', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
            req.query = { 'transaction_id': '1234' };
            req.session = {};
            req.oauth2 = {}
            req.oauth2.transactionID = '1234';
            req.oauth2.client = { id: '1', name: 'Test' };
            req.oauth2.redirectURI = 'http://www.example.com/auth/callback';
            req.oauth2.req = { redirectURI: 'http://www.example.com/auth/callback' };
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
    
      it('should maintain transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.equal('1234');
        expect(request.oauth2.client.id).to.equal('1');
        expect(request.oauth2.client.name).to.equal('Test');
        expect(request.oauth2.redirectURI).to.equal('http://www.example.com/auth/callback');
        expect(request.oauth2.req.redirectURI).to.equal('http://www.example.com/auth/callback');
      });
    });
    
    describe('handling a request without transaction id', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
            req.session = {};
            req.session.authorize = {};
            req.session.authorize['1234'] = {
              client: '1',
              redirectURI: 'http://www.example.com/auth/callback',
              req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' },
              info: { beep: 'boop' }
            };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('BadRequestError');
        expect(err.message).to.equal('Missing required parameter: transaction_id');
      });
    
      it('should not restore transaction', function() {
        expect(request.oauth2).to.be.undefined;
      });
      
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['1234']).to.be.an('object');
      });
    });
    
    describe('handling a request with transaction id that does not reference transaction', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
            req.body = { 'transaction_id': '1234' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize['5678'] = {
              client: '1',
              redirectURI: 'http://www.example.com/auth/callback',
              req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' },
              info: { beep: 'boop' }
            };
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
        expect(err.message).to.equal('Unable to load OAuth 2.0 transaction: 1234');
      });
    
      it('should not restore transaction', function() {
        expect(request.oauth2).to.be.undefined;
      });
      
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['5678']).to.be.an('object');
      });
    });
    
    describe('handling a request without transactions in session', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
            req.body = { 'transaction_id': '1234' };
            req.session = {};
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
    
      it('should not restore transaction', function() {
        expect(request.oauth2).to.be.undefined;
      });
    });
    
    describe('handling a request without a session', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
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
    
      it('should not restore transaction', function() {
        expect(request.oauth2).to.be.undefined;
      });
    });
  
    describe('encountering an error while deserializing client', function() {
      var server, request, err;

      before(function() {
        server = new Server();
        server.deserializeClient(function(id, done) {
          return done(new Error('something went wrong while deserializing client'));
        });
      });

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
            req.query = { 'transaction_id': '1234' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize['1234'] = {
              client: 'error',
              redirectURI: 'http://www.example.com/auth/callback',
              req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
            };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong while deserializing client');
      });
    
      it('should not restore transaction', function() {
        expect(request.oauth2).to.be.undefined;
      });
    
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['1234']).to.be.an('object');
      });
    });
  
    describe('handling a request initiated by deactivated client', function() {
      var server, request, err;

      before(function() {
        server = new Server();
        server.deserializeClient(function(id, done) {
          if (id !== '2') { return done(new Error('incorrect id argument')); }
          return done(null, false);
        });
      });

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
            req.query = { 'transaction_id': '1234' };
            req.session = {};
            req.session.authorize = {};
            req.session.authorize['1234'] = {
              client: '2',
              redirectURI: 'http://www.example.com/auth/callback',
              req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
            };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unauthorized client');
        expect(err.code).to.equal('unauthorized_client');
      });
    
      it('should not restore transaction', function() {
        expect(request.oauth2).to.be.undefined;
      });
    
      it('should remove transaction from session', function() {
        expect(request.session['authorize']['1234']).to.be.undefined;
      });
    });
  
    describe('with transaction field option', function() {
      
      describe('handling a request with transaction id in body', function() {
        var request, err;

        before(function(done) {
          chai.connect.use(transactionLoader(server, { transactionField: 'txn_id' }))
            .req(function(req) {
              request = req;
              req.body = { 'txn_id': '1234' };
              req.session = {};
              req.session.authorize = {};
              req.session.authorize['1234'] = {
                client: '1',
                redirectURI: 'http://www.example.com/auth/callback',
                req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
              };
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
    
        it('should restore transaction', function() {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.transactionID).to.equal('1234');
          expect(request.oauth2.client.id).to.equal('1');
          expect(request.oauth2.client.name).to.equal('Test');
          expect(request.oauth2.redirectURI).to.equal('http://www.example.com/auth/callback');
          expect(request.oauth2.req.redirectURI).to.equal('http://www.example.com/auth/callback');
          expect(request.oauth2.req.foo).to.equal('bar');
        });
    
        it('should leave transaction in session', function() {
          expect(request.session['authorize']['1234']).to.be.an('object');
        });
      });
      
      describe('handling a request without transaction id', function() {
        var request, err;

        before(function(done) {
          chai.connect.use(transactionLoader(server, { transactionField: 'txn_id' }))
            .req(function(req) {
              request = req;
              req.session = {};
              req.session.authorize = {};
              req.session.authorize['1234'] = {
                client: '1',
                redirectURI: 'http://www.example.com/auth/callback',
                req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' },
                info: { beep: 'boop' }
              };
            })
            .next(function(e) {
              err = e;
              done();
            })
            .dispatch();
        });
    
        it('should error', function() {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.constructor.name).to.equal('BadRequestError');
          expect(err.message).to.equal('Missing required parameter: txn_id');
        });
    
        it('should not restore transaction', function() {
          expect(request.oauth2).to.be.undefined;
        });
      
        it('should leave transaction in session', function() {
          expect(request.session['authorize']['1234']).to.be.an('object');
        });
      });
      
    });
  
    describe('with session key option', function() {
      
      describe('handling a request with transaction id in body', function() {
        var request, err;

        before(function(done) {
          chai.connect.use(transactionLoader(server, { sessionKey: 'oauth2orize' }))
            .req(function(req) {
              request = req;
              req.body = { 'transaction_id': '1234' };
              req.session = {};
              req.session.oauth2orize = {};
              req.session.oauth2orize['1234'] = {
                client: '1',
                redirectURI: 'http://www.example.com/auth/callback',
                req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
              };
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
    
        it('should restore transaction', function() {
          expect(request.oauth2).to.be.an('object');
          expect(request.oauth2.transactionID).to.equal('1234');
          expect(request.oauth2.client.id).to.equal('1');
          expect(request.oauth2.client.name).to.equal('Test');
          expect(request.oauth2.redirectURI).to.equal('http://www.example.com/auth/callback');
          expect(request.oauth2.req.redirectURI).to.equal('http://www.example.com/auth/callback');
          expect(request.oauth2.req.foo).to.equal('bar');
        });
    
        it('should leave transaction in session', function() {
          expect(request.session['oauth2orize']['1234']).to.be.an('object');
        });
      });
      
    });
  
  });
  
  describe('using non-legacy transaction store', function() {
    var server;
  
    before(function() {
      var MockStore = require('../mock/store');
      server = new Server({ store: new MockStore() });
    });
  
    describe('handling a request with state', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(transactionLoader(server))
          .req(function(req) {
            request = req;
            req.body = { 'state': '1234' };
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
    
      it('should restore transaction', function() {
        expect(request.oauth2).to.be.an('object');
        expect(request.oauth2.transactionID).to.equal('1234');
        expect(request.oauth2.redirectURI).to.equal('http://www.example.com/auth/callback');
      });
    });
  });
  
});

