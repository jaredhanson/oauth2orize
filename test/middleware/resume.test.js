/* global describe, it, expect, before */
/* jshint camelcase: false, expr: true, sub: true */

var chai = require('chai')
  , resume = require('../../lib/middleware/resume')
  , Server = require('../../lib/server');


describe('authorization', function() {
  
  it('should be named resume', function() {
    var server = new Server();
    expect(resume(server, function(){}).name).to.equal('resume');
  });
  
  it('should throw if constructed without a server argument', function() {
    expect(function() {
      resume();
    }).to.throw(TypeError, 'oauth2orize.resume middleware requires a server argument');
  });
  
  it('should throw if constructed without a immediate argument', function() {
    expect(function() {
      var server = new Server();
      resume(server);
    }).to.throw(TypeError, 'oauth2orize.resume middleware requires an immediate function');
  });
  
});
