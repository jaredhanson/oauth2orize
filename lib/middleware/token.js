/**
 * Module dependencies.
 */
var AuthorizationError = require('../errors/authorizationerror');


/**
 * Exchanges authorization grants for access tokens.
 *
 * An access token is a string denoting a specific scope, lifetime, and other
 * access attributes.
 *
 * Note that clients issued credentials must authenticate when when making
 * requests to the token endpoint.  This is essential for enforcing the binding
 * of authorization codes and refresh tokens to the client they were issued to.
 *
 * Some client deployements may be incapable of secure client authentication.
 * Applications are responsbile for determining what level of exposure is
 * acceptable, and handling such clients and displaying notices as appropriate.
 *
 * References:
 *  - [Token Endpoint](http://tools.ietf.org/html/draft-ietf-oauth-v2-26#section-3.2)
 *
 * @param {Server} server
 * @param {Object} options
 * @api protected
 */
module.exports = function token(server, options) {
  options = options || {};
  
  if (!server) throw new Error('OAuth 2.0 token middleware requires a server instance.');
  
  return function token(req, res, next) {
    var type = req.body['grant_type'];
    
    server._exchange(type, req, res, function(err) {
      if (err) { return next(err); }
      return next(new AuthorizationError('invalid grant type', 'unsupported_grant_type'));
    });
  }
}
