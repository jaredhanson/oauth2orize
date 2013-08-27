var chai = require('chai')
  , decision = require('../../lib/middleware/decision')
  , Server = require('../../lib/server');


describe('transactionLoader', function() {
  
  var server = new Server();
  
  it('should be named decision', function() {
    expect(decision(server).name).to.equal('decision');
  });
  
  it('should throw if constructed without a server argument', function() {
    expect(function() {
      decision();
    }).to.throw(TypeError, 'oauth2orize.decision middleware requires a server argument');
  });
  
});

