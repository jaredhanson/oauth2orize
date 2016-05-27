/**
 * Module dependencies.
 */
var utils = require('../utils')
  , TokenError = require('../errors/tokenerror');


/**
 * Exchanges resource owner password credentials for access tokens.
 *
 * This exchange middleware is used to by clients to obtain an access token by
 * presenting the resource owner's password credentials.  These credentials are
 * typically obtained directly from the user, by prompting them for input.
 *
 * Callbacks:
 *
 * This middleware requires an `issue` callback, for which the function
 * signature is as follows:
 *
 *     function(client, username, password, scope, body, authInfo, done) { ... }
 *
 * `client` is the authenticated client instance attempting to obtain an access
 * token.  `username` and `password` and the resource owner's credentials.
 * `scope` is the scope of access requested by the client.  `done` is called to
 * issue an access token:
 *
 *     done(err, accessToken, refreshToken, params)
 *
 * `accessToken` is the access token that will be sent to the client.  An
 * optional `refreshToken` will be sent to the client, if the server chooses to
 * implement support for this functionality.  Any additional `params` will be
 * included in the response.  If an error occurs, `done` should be invoked with
 * `err` set in idomatic Node.js fashion.
 *
 * Options:
 *
 *     userProperty    property of `req` which contains the authenticated client (default: 'user')
 *     scopeSeparator  separator used to demarcate scope values (default: ' ')
 *
 * Examples:
 *
 *     server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
 *       AccessToken.create(client, username, password, scope, function(err, accessToken) {
 *         if (err) { return done(err); }
 *         done(null, accessToken);
 *       });
 *     }));
 *
 * References:
 *  - [Resource Owner Password Credentials](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-1.3.3)
 *  - [Resource Owner Password Credentials Grant](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-4.3)
 *
 * @param {Object} options
 * @param {Function} issue
 * @return {Function}
 * @api public
 */
module.exports = function(options, issue) {
  if (typeof options == 'function') {
    issue = options;
    options = undefined;
  }
  options = options || {};

  if (!issue) { throw new TypeError('oauth2orize.password exchange requires an issue callback'); }

  var userProperty = options.userProperty || 'user';

  // For maximum flexibility, multiple scope spearators can optionally be
  // allowed.  This allows the server to accept clients that separate scope
  // with either space or comma (' ', ',').  This violates the specification,
  // but achieves compatibility with existing client libraries that are already
  // deployed.
  var separators = options.scopeSeparator || ' ';
  if (!Array.isArray(separators)) {
    separators = [ separators ];
  }

  return function password(req, res, next) {
    if (!req.body) { return next(new Error('OAuth2orize requires body parsing. Did you forget app.use(express.bodyParser())?')); }
    
    // The 'user' property of `req` holds the authenticated user.  In the case
    // of the token endpoint, the property will contain the OAuth 2.0 client.
    var client = req[userProperty]
      , username = req.body.username
      , passwd = req.body.password
      , scope = req.body.scope;
      
    if (!username) { return next(new TokenError('Missing required parameter: username', 'invalid_request')); }
    if (!passwd) { return next(new TokenError('Missing required parameter: password', 'invalid_request')); }
    
    if (scope) {
      for (var i = 0, len = separators.length; i < len; i++) {
        var separated = scope.split(separators[i]);
        // only separate on the first matching separator.  this allows for a sort
        // of separator "priority" (ie, favor spaces then fallback to commas)
        if (separated.length > 1) {
          scope = separated;
          break;
        }
      }
      if (!Array.isArray(scope)) { scope = [ scope ]; }
    }
    
    function issued(err, accessToken, refreshToken, params) {
      if (err) { return next(err); }
      if (!accessToken) { return next(new TokenError('Invalid resource owner credentials', 'invalid_grant')); }
      if (refreshToken && typeof refreshToken == 'object') {
        params = refreshToken;
        refreshToken = null;
      }
      
      var tok = {};
      tok.access_token = accessToken;
      if (refreshToken) { tok.refresh_token = refreshToken; }
      if (params) { utils.merge(tok, params); }
      tok.token_type = tok.token_type || 'Bearer';
      
      var json = JSON.stringify(tok);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      res.end(json);
    }

    try {
      var arity = issue.length;
      if (arity == 7) {
        issue(client, username, passwd, scope, req.body, req.authInfo, issued);
      } else if (arity == 6) {
        issue(client, username, passwd, scope, req.body, issued);
      } else if (arity == 5) {
        issue(client, username, passwd, scope, issued);
      } else { // arity == 4
        issue(client, username, passwd, issued);
      }
    } catch (ex) {
      return next(ex);
    }
  };
};
