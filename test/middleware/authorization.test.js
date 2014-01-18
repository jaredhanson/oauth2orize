/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true, sub: true */

var chai = require('chai')
  , authorization = require('../../lib/middleware/authorization')
  , Server = require('../../lib/server');


describe('authorization', function() {
  
  var server = new Server();
  server.serializeClient(function(client, done) {
    if (client.id == '1234' || client.id == '2234' || client.id == '3234') { return done(null, client.id); }
    return done(new Error('something went wrong while serializing client'));
  });
  
  server.grant('code', function(req) {
    return {
      clientID: req.query['client_id'],
      redirectURI: req.query['redirect_uri'],
      scope: req.query['scope']
    };
  });
  
  server.grant('throw-error', function(req) {
    throw new Error('something went wrong while parsing authorization request');
  });
  
  function validate(clientID, redirectURI, done) {
    if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback') {
      return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
    }
    if (clientID == '1235' && redirectURI == 'http://example.com/auth/callback') {
      return done(null, { id: '1235', name: 'Example' }, 'http://example.com/auth/callback');
    }
    if (clientID == '2234') {
      return done(null, false);
    }
    if (clientID == '3234') {
      return done(null, false, 'http://example.com/auth/callback');
    }
    if (clientID == '4234') {
      throw new Error('something was thrown while validating client');
    }
    return done(new Error('something went wrong while validating client'));
  }
  
  
  it('should be named authorization', function() {
    expect(authorization(server, function(){}).name).to.equal('authorization');
  });
  
  it('should throw if constructed without a server argument', function() {
    expect(function() {
      authorization();
    }).to.throw(TypeError, 'oauth2orize.authorization middleware requires a server argument');
  });
  
  it('should throw if constructed without a validate argument', function() {
    expect(function() {
      authorization(server);
    }).to.throw(TypeError, 'oauth2orize.authorization middleware requires a validate function');
  });
  
  describe('handling a request for authorization', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
          req.session = {};
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
      expect(request.oauth2.transactionID).to.be.a('string');
      expect(request.oauth2.transactionID).to.have.length(8);
      expect(request.oauth2.client.id).to.equal('1234');
      expect(request.oauth2.client.name).to.equal('Example');
      expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
      expect(request.oauth2.req.type).to.equal('code');
      expect(request.oauth2.req.clientID).to.equal('1234');
      expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
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
    });
  });
  
  describe('handling a request for authorization with empty query', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = {};
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
      expect(err.constructor.name).to.equal('AuthorizationError');
      expect(err.message).to.equal('Missing required parameter: response_type');
      expect(err.code).to.equal('invalid_request');
    });
  
    it('should not start transaction', function() {
      expect(request.oauth2).to.be.undefined;
    });
  });
  
  describe('handling a request for authorization with unsupported response type', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'foo', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
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
      expect(err.constructor.name).to.equal('AuthorizationError');
      expect(err.message).to.equal('Unsupported response type: foo');
      expect(err.code).to.equal('unsupported_response_type');
    });
  
    it('should not start transaction', function() {
      expect(request.oauth2).to.be.undefined;
    });
  });
  
  describe('handling a request for authorization from unauthorized client', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: '2234', redirect_uri: 'http://example.com/auth/callback' };
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
      expect(err.constructor.name).to.equal('AuthorizationError');
      expect(err.message).to.equal('Unauthorized client');
      expect(err.code).to.equal('unauthorized_client');
    });
  
    it('should start transaction', function() {
      expect(request.oauth2).to.be.an('object');
      expect(request.oauth2.client).to.be.undefined;
      expect(request.oauth2.redirectURI).to.be.undefined;
    });
  });
  
  describe('handling a request for authorization from unauthorized client informed via redirect', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: '3234', redirect_uri: 'http://example.com/auth/callback' };
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
      expect(err.constructor.name).to.equal('AuthorizationError');
      expect(err.message).to.equal('Unauthorized client');
      expect(err.code).to.equal('unauthorized_client');
    });
  
    it('should start transaction', function() {
      expect(request.oauth2).to.be.an('object');
      expect(request.oauth2.client).to.be.undefined;
      expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
    });
  });
  
  describe('encountering an error thrown while parsing request', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'throw-error', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
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
      expect(err.message).to.equal('something went wrong while parsing authorization request');
    });
  
    it('should not start transaction', function() {
      expect(request.oauth2).to.be.undefined;
    });
  });
  
  describe('encountering an error while validating client', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: '9234', redirect_uri: 'http://example.com/auth/callback' };
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
      expect(err.message).to.equal('something went wrong while validating client');
    });
  
    it('should start transaction', function() {
      expect(request.oauth2).to.be.an('object');
      expect(request.oauth2.client).to.be.undefined;
      expect(request.oauth2.redirectURI).to.be.undefined;
    });
  });
  
  describe('encountering an error thrown while validating client', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: '4234', redirect_uri: 'http://example.com/auth/callback' };
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
      expect(err.message).to.equal('something was thrown while validating client');
    });
  
    it('should not start transaction', function() {
      expect(request.oauth2).to.be.undefined;
    });
  });
  
  describe('encountering an error while serializing client', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: '1235', redirect_uri: 'http://example.com/auth/callback' };
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
      expect(err.message).to.equal('something went wrong while serializing client');
    });
  
    it('should start transaction', function() {
      expect(request.oauth2).to.be.an('object');
      expect(request.oauth2.client.id).to.equal('1235');
      expect(request.oauth2.client.name).to.equal('Example');
      expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
      expect(request.oauth2.req).to.be.an('object');
      expect(request.oauth2.req.type).to.equal('code');
      expect(request.oauth2.req.clientID).to.equal('1235');
      expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
    });
  });
  
  describe('handling a request for authorization without a session', function() {
    var request, err;

    before(function(done) {
      chai.connect.use(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
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
  
    it('should not start transaction', function() {
      expect(request.oauth2).to.be.undefined;
    });
  });
  
  describe('validate with scope', function() {
    function validate(clientID, redirectURI, scope, done) {
      if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback' && scope == 'write') {
        return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
      }
      return done(new Error('something went wrong while validating client'));
    }
    
    describe('handling a request for authorization', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(authorization(server, validate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'write' };
            req.session = {};
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
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(8);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.scope).to.equal('write');
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
        expect(request.session['authorize'][tid].req.scope).to.equal('write');
      });
    });
  });
  
  describe('validate with scope and type', function() {
    function validate(clientID, redirectURI, scope, type, done) {
      if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback' && scope == 'write' && type == 'code') {
        return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
      }
      return done(new Error('something went wrong while validating client'));
    }
    
    describe('handling a request for authorization', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(authorization(server, validate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'write' };
            req.session = {};
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
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(8);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.scope).to.equal('write');
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
        expect(request.session['authorize'][tid].req.scope).to.equal('write');
      });
    });
  });
  
  describe('validate with authorization request', function() {
    function validate(areq, done) {
      if (areq.clientID == '1234' && areq.redirectURI == 'http://example.com/auth/callback') {
        return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
      }
      return done(new Error('something went wrong while validating client'));
    }
    
    describe('handling a request for authorization', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(authorization(server, validate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
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
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(8);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
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
      });
    });
  });
  
  describe('with id length option', function() {
    describe('handling a request for authorization', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(authorization(server, { idLength: 12 }, validate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
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
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(12);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
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
      });
    });
  });
  
  describe('with session key option', function() {
    describe('handling a request for authorization', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(authorization(server, { sessionKey: 'oauth2z' }, validate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
            req.session = {};
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
        expect(request.oauth2.transactionID).to.be.a('string');
        expect(request.oauth2.transactionID).to.have.length(8);
        expect(request.oauth2.client.id).to.equal('1234');
        expect(request.oauth2.client.name).to.equal('Example');
        expect(request.oauth2.redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.oauth2.req.type).to.equal('code');
        expect(request.oauth2.req.clientID).to.equal('1234');
        expect(request.oauth2.req.redirectURI).to.equal('http://example.com/auth/callback');
      });
    
      it('should store transaction in session', function() {
        var tid = request.oauth2.transactionID;
        expect(request.session['oauth2z'][tid]).to.be.an('object');
        expect(request.session['oauth2z'][tid].protocol).to.equal('oauth2');
        expect(request.session['oauth2z'][tid].client).to.equal('1234');
        expect(request.session['oauth2z'][tid].redirectURI).to.equal('http://example.com/auth/callback');
        expect(request.session['oauth2z'][tid].req.type).to.equal('code');
        expect(request.session['oauth2z'][tid].req.clientID).to.equal('1234');
        expect(request.session['oauth2z'][tid].req.redirectURI).to.equal('http://example.com/auth/callback');
      });
    });
  });
  
  describe('server without registered grants', function() {
    var server = new Server();
    server.serializeClient(function(client, done) {
      return done(null, client.id);
    });
  
    function validate(clientID, redirectURI, done) {
      if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback') {
        return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
      }
      return done(new Error('something went wrong while validating client'));
    }
    
    describe('handling a request for authorization', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(authorization(server, validate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
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
        expect(err.constructor.name).to.equal('AuthorizationError');
        expect(err.message).to.equal('Unsupported response type: code');
        expect(err.code).to.equal('unsupported_response_type');
      });
    
      it('should not start transaction', function() {
        expect(request.oauth2).to.be.undefined;
      });
    });
  });
  
});
