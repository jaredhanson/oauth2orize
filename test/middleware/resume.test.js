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
  
  describe('prerequisite middleware checks', function() {
    var server;
    
    before(function() {
      server = new Server();
    });
    
    describe('handling a request without a transaction', function() {
      var request, err;

      before(function(done) {
        chai.connect.use(resume(server, function(){}))
          .req(function(req) {
            request = req;
            req.query = {};
            req.body = {};
            req.session = {};
            req.session['authorize'] = {};
            req.session['authorize']['abc123'] = { protocol: 'oauth2' };
            req.user = { id: 'u1234', username: 'bob' };
          })
          .next(function(e) {
            err = e;
            done();
          })
          .dispatch();
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('OAuth2orize requires transaction support. Did you forget oauth2orize.transactionLoader(...)?');
      });
    
      it('should leave transaction in session', function() {
        expect(request.session['authorize']['abc123']).to.be.an('object');
      });
    });
    
  });
  
});
