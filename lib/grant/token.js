/**
 * Module dependencies.
 */
var url = require('url')
  , qs = require('querystring')
  , utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror');


/* Handles authorization requests using an implicit access token as a grant.
 *
 * Applications must supply an `issue` callback that issues access tokens.
 * The callback accepts four arguments: `client`, `user`, `scope` and a `done`
 * callback, which accepts `err`, `accessToken`, and `params` arguments in
 * idomatic fashion (see below for examples).
 *
 * The `client` argument is supplied by the application through the
 * `validateRequest` function, and optionally serialized to and from of the
 * session via `serializeClient` and `deserializeClient`.
 *
 * Implicit grants do not include client authentication, and rely on the
 * registration of the redirect URI.  Applications can enforce this constraint
 * in the `validateRequest` function.
 *
 * Options:
 *
 *     scopeSeparator  separator used to demarcate scope values (default: ' ')
 *
 * Examples:
 *
 *     server.exchange(oauth2orize.approve.token(function(client, user, scope, done) {}
 *       AccessToken.create(client, user, scope, function(err, accessToken) {
 *         if (err) { return done(err); }
 *         done(null, accessToken);
 *       });
 *     }));
 *
 * References:
 *  - [Implicit](http://tools.ietf.org/html/draft-ietf-oauth-v2-26#section-1.3.2)
 *  - [Implicit Grant](http://tools.ietf.org/html/draft-ietf-oauth-v2-26#section-4.2)
 *
 * @param {Object} options
 * @param {Function} issue
 * @api public
 */
module.exports = function token(options, issue) {
  if (typeof options == 'function') {
    issue = options;
    options = null;
  }
  options = options || {};
  
  if (!issue) throw new Error('OAuth 2.0 token grant middleware requires an issue function.');
  
  // For maximum flexibility, multiple scope spearators can optionally be
  // allowed.  This allows the server to accept clients that separate scope
  // with either space or comma (' ', ',').  This violates the specification,
  // but achieves compatibility with existing client libraries that are already
  // deployed.
  var separators = options.scopeSeparator || ' ';
  if (!Array.isArray(separators)) {
    separators = [ separators ];
  }
  
  
  /* Parse requests that request `token` as `response_type`.
   *
   * @param {http.ServerRequest} req
   * @api public
   */
  function request(req) {
    var clientID = req.query['client_id']
      , redirectURI = req.query['redirect_uri']
      , scope = req.query['scope']
      , state = req.query['state'];
      
    if (!clientID) { throw new AuthorizationError('missing client_id parameter', 'invalid_request'); }
    
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
    
    return {
      clientID: clientID,
      redirectURI: redirectURI,
      scope: scope,
      state: state
    }
  }
  
  /* Sends responses to transactions that request `token` as `response_type`.
   *
   * @param {Object} txn
   * @param {http.ServerResponse} res
   * @param {Function} next
   * @api public
   */
  function response(txn, res, next) {
    if (!txn.redirectURI) { return next(new Error('No redirect URI available to send OAuth 2.0 response.')); }
    if (!txn.res.allow) {
      var err = {};
      err['error'] = 'access_denied';
      if (txn.req && txn.req.state) { err['state'] = txn.req.state; }
      
      var parsed = url.parse(txn.redirectURI);
      parsed.hash = qs.stringify(err);
      
      var location = url.format(parsed);
      return res.redirect(location);
    }
    
    function issued(err, accessToken, params) {
      if (err) { return next(err); }
      if (!accessToken) { return next(new AuthorizationError('authorization server denied request', 'access_denied')); }
      
      var tok = {};
      tok['access_token'] = accessToken;
      if (params) { utils.merge(tok, params); }
      tok['token_type'] = tok['token_type'] || 'bearer';
      if (txn.req && txn.req.state) { tok['state'] = txn.req.state; }
      
      var parsed = url.parse(txn.redirectURI);
      parsed.hash = qs.stringify(tok);
      
      var location = url.format(parsed);
      return res.redirect(location);
    }
    
    // NOTE: In contrast to an authorization code grant, redirectURI is not
    //       passed as an argument to the issue callback because it is not used
    //       as a verifier in a subsequent token exchange.  However, when
    //       issuing an implicit access tokens, an application must ensure that
    //       the redirection URI is registered, which can be done in the
    //       `validate` callback of `authorization` middleware.
    
    var arity = issue.length;
    if (arity == 4) {
      issue(txn.client, txn.user, txn.res, issued);
    } else { // arity == 3
      issue(txn.client, txn.user, issued);
    }
  }
  
  
  /**
   * Return `token` approval module.
   */
  var mod = {};
  mod.name = 'token';
  mod.request = request;
  mod.response = response;
  return mod;
}
