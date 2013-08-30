var chai = require('chai')
  , token = require('../../lib/grant/token');


describe('grant.token', function() {
  
  describe('module', function() {
    var mod = token(function(){});
    
    it('should be named token', function() {
      expect(mod.name).to.equal('token');
    });
    
    it('should expose request and response functions', function() {
      expect(mod.request).to.be.a('function');
      expect(mod.response).to.be.a('function');
    });
  });
  
  it('should throw if constructed without a issue callback', function() {
    expect(function() {
      token();
    }).to.throw(TypeError, 'oauth2orize.token grant requires an issue callback');
  });

});
