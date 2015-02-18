var OAuth2Error = require('../../lib/errors/oauth2error')
  , TokenError = require('../../lib/errors/tokenerror');


describe('TokenError', function() {
    
  describe('constructed without a message', function() {
    var err = new TokenError();
    
    it('should have default properties', function() {
      expect(err.message).to.be.undefined;
      expect(err.code).to.equal('server_error');
      expect(err.uri).to.be.undefined;
      expect(err.status).to.equal(500);
    });
    
    it('should format correctly', function() {
      //expect(err.toString()).to.equal('AuthorizationError');
      expect(err.toString().indexOf('TokenError')).to.equal(0);
    });
    
    it('should inherits from OAuth2Error and Error', function() {
      expect(err).to.be.instanceof(OAuth2Error);
      expect(err).to.be.instanceof(Error);
    });
  });
  
  describe('constructed with a message', function() {
    var err = new TokenError('Invalid return URI');
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Invalid return URI');
      expect(err.code).to.equal('server_error');
      expect(err.uri).to.be.undefined;
      expect(err.status).to.equal(500);
    });
    
    it('should format correctly', function() {
      expect(err.toString()).to.equal('TokenError: Invalid return URI');
    });
  });
  
  describe('constructed with a message and invalid_request code', function() {
    var err = new TokenError('Invalid request', 'invalid_request');
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Invalid request');
      expect(err.code).to.equal('invalid_request');
      expect(err.uri).to.be.undefined;
      expect(err.status).to.equal(400);
    });
  });
  
  describe('constructed with a message and invalid_client code', function() {
    var err = new TokenError('Invalid client', 'invalid_client');
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Invalid client');
      expect(err.code).to.equal('invalid_client');
      expect(err.uri).to.be.undefined;
      expect(err.status).to.equal(401);
    });
  });
  
  describe('constructed with a message and invalid_grant code', function() {
    var err = new TokenError('Invalid grant', 'invalid_grant');
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Invalid grant');
      expect(err.code).to.equal('invalid_grant');
      expect(err.uri).to.be.undefined;
      expect(err.status).to.equal(403);
    });
  });
  
  describe('constructed with a message and unauthorized_client code', function() {
    var err = new TokenError('Unauthorized client', 'unauthorized_client');
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Unauthorized client');
      expect(err.code).to.equal('unauthorized_client');
      expect(err.uri).to.be.undefined;
      expect(err.status).to.equal(403);
    });
  });
  
  describe('constructed with a message and unsupported_grant_type code', function() {
    var err = new TokenError('Unsupported grant type', 'unsupported_grant_type');
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Unsupported grant type');
      expect(err.code).to.equal('unsupported_grant_type');
      expect(err.uri).to.be.undefined;
      expect(err.status).to.equal(501);
    });
  });
  
  describe('constructed with a message and invalid_scope code', function() {
    var err = new TokenError('Invalid scope', 'invalid_scope');
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Invalid scope');
      expect(err.code).to.equal('invalid_scope');
      expect(err.uri).to.be.undefined;
      expect(err.status).to.equal(400);
    });
  });
  
  describe('constructed with a message, code, uri and status', function() {
    var err = new TokenError('Payment required', 'payment_required', 'http://www.example.com/oauth/help', 402);
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Payment required');
      expect(err.code).to.equal('payment_required');
      expect(err.uri).to.equal('http://www.example.com/oauth/help');
      expect(err.status).to.equal(402);
    });
    
    it('should format correctly', function() {
      expect(err.toString()).to.equal('TokenError: Payment required');
    });
  });
  
});
