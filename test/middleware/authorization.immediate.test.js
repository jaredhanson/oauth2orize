var chai = require('chai')
  , authorization = require('../../lib/middleware/authorization')
  , Server = require('../../lib/server');


describe('authorization', function() {
  
  var server = new Server();
  server.serializeClient(function(client, done) {
    if (client.id == '1234' || client.id == '2234') { return done(null, client.id); }
    return done(new Error('something went wrong while serializing client'));
  });
  
  server.grant('code', function(req) {
    return {
      clientID: req.query['client_id'],
      redirectURI: req.query['redirect_uri'],
      scope: req.query['scope']
    }
  });
  server.grant('code', 'response', function(txn, res, next) {
    if ((txn.client.id == '1234' || txn.client.id == '2234') && txn.user.id == 'u123' && txn.res.allow === true && txn.res.scope === 'read') {
      return res.redirect(txn.redirectURI);
    }
    return done(new Error('something went wrong while sending response'));
  });
  
  function validate(clientID, redirectURI, done) {
    if (clientID == '1234' && redirectURI == 'http://example.com/auth/callback') {
      return done(null, { id: '1234', name: 'Example' }, 'http://example.com/auth/callback');
    } else if (clientID == '2234' && redirectURI == 'http://example.com/auth/callback') {
      return done(null, { id: '2234', name: 'Example' }, 'http://example.com/auth/callback');
    }
    return done(new Error('something went wrong while validating client'));
  }
  
  function immediate(client, user, done) {
    if (client.id == '1234' && user.id == 'u123') {
      return done(null, true, { scope: 'read' });
    } else if (client.id == '2234' && user.id == 'u123') {
      return done(null, false);
    }
    return done(new Error('something went wrong while checking immediate status'));
  }
  
  describe('handling a request that is immediately authorized', function() {
    var request, response, err;

    before(function(done) {
      chai.connect(authorization(server, validate, immediate))
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
    var request, response, err;

    before(function(done) {
      chai.connect(authorization(server, validate, immediate))
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
  
});
