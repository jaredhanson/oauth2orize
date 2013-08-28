var chai = require('chai')
  , authorization = require('../../lib/middleware/authorization')
  , Server = require('../../lib/server');


describe('decision', function() {
  
  var server = new Server();
  
  server.serializeClient(function(client, done) {
    return done(null, client.id);
  });
  
  server.grant('code', function(req) {
    return {
      clientID: req.query['client_id'],
      redirectURI: req.query['redirect_uri'],
      scope: req.query['scope']
    }
  });
  
  function validate(clientID, redirectURI, done) {
    if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback') {
      return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
    }
    return done(new Error('validate failure'));
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
      chai.connect(authorization(server, validate))
        .req(function(req) {
          request = req;
          req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback' };
          req.session = {};
        })
        .next(function(e) {
          console.log(e);
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
  
  describe('validate with scope', function() {
    function validate(clientID, redirectURI, scope, done) {
      if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback' && scope == 'write') {
        return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
      }
      return done(new Error('validate failure'));
    }
    
    describe('handling a request for authorization', function() {
      var request, err;

      before(function(done) {
        chai.connect(authorization(server, validate))
          .req(function(req) {
            request = req;
            req.query = { response_type: 'code', client_id: '1234', redirect_uri: 'http://example.com/auth/callback', scope: 'write' };
            req.session = {};
          })
          .next(function(e) {
            console.log(e);
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
  
});
