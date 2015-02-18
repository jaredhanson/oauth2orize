var oauth2orize = require('..')
  , Server = require('../lib/server');
  

describe('oauth2orize', function() {
  
  it('should export createServer', function() {
    expect(oauth2orize).to.be.a('function');
    expect(oauth2orize.createServer).to.be.a('function');
    expect(oauth2orize).to.equal(oauth2orize.createServer);
  });
  
  it('should export middleware', function() {
    expect(oauth2orize.errorHandler).to.be.a('function');
  });
  
  it('should export grants', function() {
    expect(oauth2orize.grant).to.be.an('object');
    expect(oauth2orize.grant.code).to.be.a('function');
    expect(oauth2orize.grant.token).to.be.a('function');
  });
  
  it('should export aliased grants', function() {
    expect(oauth2orize.grant.authorizationCode).to.equal(oauth2orize.grant.code);
    expect(oauth2orize.grant.implicit).to.equal(oauth2orize.grant.token);
  });
  
  it('should export exchanges', function() {
    expect(oauth2orize.exchange).to.be.an('object');
    expect(oauth2orize.exchange.authorizationCode).to.be.a('function');
    expect(oauth2orize.exchange.clientCredentials).to.be.a('function');
    expect(oauth2orize.exchange.password).to.be.a('function');
    expect(oauth2orize.exchange.refreshToken).to.be.a('function');
  });
  
  it('should export aliased exchanges', function() {
    expect(oauth2orize.exchange.code).to.equal(oauth2orize.exchange.authorizationCode);
  });
  
  it('should export Error constructors', function() {
    expect(oauth2orize.OAuth2Error).to.be.a('function');
    expect(oauth2orize.AuthorizationError).to.be.a('function');
    expect(oauth2orize.TokenError).to.be.a('function');
  });
  
  
  describe('.createServer', function() {
    it('should return a server', function() {
      var s = oauth2orize.createServer();
      expect(s).to.be.an.instanceOf(Server);
    });
  });
  
});
