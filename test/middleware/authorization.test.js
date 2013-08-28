var chai = require('chai')
  , authorization = require('../../lib/middleware/authorization')
  , Server = require('../../lib/server');


describe('decision', function() {
  
  var server = new Server();
  /*
  server.grant('code', 'response', function(txn, res, next) {
    if (txn.res.allow == false) { return res.redirect(txn.redirectURI + '?error=access_denied'); }
    if (txn.transactionID == 'abc123') { return res.redirect(txn.redirectURI + '?code=a1b1c1'); }
    return next(new Error('grant code failure'));
  });
  */
  
  it('should be named authorization', function() {
    expect(authorization(server, function(){}).name).to.equal('authorization');
  });
  
  it('should throw if constructed without a server argument', function() {
    expect(function() {
      authorization();
    }).to.throw(TypeError, 'oauth2orize.authorization middleware requires a server argument');
  });
  
  it('should throw if constructed without a validate argument', function() {
    expect(function() {
      authorization(server);
    }).to.throw(TypeError, 'oauth2orize.authorization middleware requires a validate function');
  });
  
});
