/**
 * Module dependencies.
 */
var utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror');


/**
 * Exchanges authorization codes for access tokens.
 *
 * Applications must supply an `issue` callback that issues access tokens and
 * optional refresh tokens.  The callback accepts four arguments: `client`,
 * `code`, `redirectURI` and a `done` callback, which accepts `err`,
 * `accessToken`, `refreshToken` and `params` arguments in idomatic fashion (see
 * below for examples).
 *
 * The `client` argument is obtained from the `req.user` property, which is set
 * when authenticating the OAuth 2.0 client.  This may be undefined if no
 * authentication is performed.  `redirectURI` acts as a verifier and is set if
 * the client included it in the initial authorization request.  If present,
 * the values from both requests must be identical.
 *
 * Options:
 *
 *     userProperty   property of `req` which contains the authenticated client (default: 'user')
 *
 * Examples:
 *
 *     server.exchange(oauth2orize.exchange.authorizationCode(function(client, code, redirectURI, done) {
 *       AccessToken.create(client, code, redirectURI, function(err, accessToken) {
 *         if (err) { return done(err); }
 *         done(null, accessToken);
 *       });
 *     }));
 *
 * References:
 *  - [Access Token Request](http://tools.ietf.org/html/draft-ietf-oauth-v2-26#section-4.1.3)
 *
 * @param {Object} options
 * @param {Function} issue
 * @api public
 */
module.exports = function authorizationCode(options, issue) {
  if (typeof options == 'function') {
    issue = options;
    options = null;
  }
  options = options || {};
  
  if (!issue) throw new Error('OAuth 2.0 authorizationCode exchange middleware requires an issue function.');
  
  var userProperty = options.userProperty || 'user';

  return function authorization_code(req, res, next) {
    if (!req.body) { return next(new Error('Request body not parsed. Use bodyParser middleware.')); }
    
    // The 'user' property of `req` holds the authenticated user.  In the case
    // of the token endpoint, the property will contain the OAuth 2.0 client.
    var client = req[userProperty]
      , code = req.body['code']
      , redirectURI = req.body['redirect_uri'];
      
    if (!code) { return next(new AuthorizationError('missing code parameter', 'invalid_request')); }
    
    issue(client, code, redirectURI, function(err, accessToken, refreshToken, params) {
      if (err) { return next(err); }
      if (!accessToken) { return next(new AuthorizationError('invalid code', 'invalid_grant')); }
      
      var tok = {};
      tok['access_token'] = accessToken;
      if (refreshToken) { tok['refresh_token'] = refreshToken; }
      if (params) { utils.merge(tok, params); }
      tok['token_type'] = tok['token_type'] || 'bearer';
      
      var json = JSON.stringify(tok);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      res.end(json);
    });
  }
}
