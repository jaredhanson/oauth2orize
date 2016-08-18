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
  
});
