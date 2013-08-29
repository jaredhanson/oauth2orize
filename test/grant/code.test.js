var chai = require('chai')
  , code = require('../../lib/grant/code');


describe('grant.code', function() {
  
  describe('module', function() {
    var mod = code(function(){});
    
    it('should be named code', function() {
      expect(mod.name).to.equal('code');
    });
    
    it('should expose request and response functions', function() {
      expect(mod.request).to.be.a('function');
      expect(mod.response).to.be.a('function');
    });
  });
  
  it('should throw if constructed without a issue callback', function() {
    expect(function() {
      code();
    }).to.throw(TypeError, 'oauth2orize.code grant requires an issue callback');
  });
  
});
