var chai = require('chai')
  , token = require('../../lib/middleware/token')
  , Server = require('../../lib/server');


describe('token', function() {
  
  var server = new Server();
  
  it('should be named token', function() {
    expect(token(server).name).to.equal('token');
  });
  
  it('should throw if constructed without a server argument', function() {
    expect(function() {
      token();
    }).to.throw(TypeError, 'oauth2orize.token middleware requires a server argument');
  });
  
});
