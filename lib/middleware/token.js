/**
 * Module dependencies.
 */
var TokenError = require('../errors/tokenerror');


/**
 * Exchanges authorization grants for access tokens.
 *
 * Obtaining authorization via OAuth 2.0 consists of a sequence of discrete
 * steps.  First, the client requests authorization from the user (in this case
 * using an authorization server as an intermediary).  The authorization server
 * conducts an approval dialog with the user to obtain permission.  After access
 * has been allowed, a grant is issued to the client which can be exchanged for
 * an access token.
 *
 * This middleware is used to exchange a previously issued authorization grant
 * for an access token (a string denoting a specific scope, lifetime, and other
 * access attributes).
 *
 * The types of the grants that can be exchanged will depend on the types
 * supported by the server.   An application can implement support for these
 * types as necessary, including taking advantage of bundled grant and exchange
 * middleware.
 *
 * Note that clients issued credentials must authenticate when when making
 * requests to the token endpoint.  This is essential for enforcing the binding
 * of authorization codes and refresh tokens to the client they were issued to.
 * Some client deployments may be incapable of secure client authentication.
 * Applications are responsible for determining what level of exposure is
 * acceptable, and handling such clients and displaying notices as appropriate.
 *
 * Examples:
 *
 *     app.post('/token',
 *       passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
 *       server.token(),
 *       server.errorHandler());
 *
 * References:
 *  - [Token Endpoint](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-3.2)
 *
 * @param {Server} server
 * @param {Object} options
 * @return {Function}
 * @api protected
 */
module.exports = function token(server, options) {
  options = options || {};
  
  if (!server) { throw new TypeError('oauth2orize.token middleware requires a server argument'); }
  
  return function token(req, res, next) {
    var type = req.body.grant_type;
    
    server._exchange(type, req, res, function(err) {
      if (err) { return next(err); }
      return next(new TokenError('Unsupported grant type: ' + type, 'unsupported_grant_type'));
    });
  };
};
