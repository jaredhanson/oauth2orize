/**
 * Module dependencies.
 */
var url = require('url')
  , AuthorizationError = require('../errors/authorizationerror');


/**
 * Handles requests to obtain a grant in the form of an authorization code.
 *
 * Callbacks:
 *
 * This middleware requires an `issue` callback, for which the function
 * signature is as follows:
 *
 *     function(client, redirectURI, user, ares, done) { ... }
 *
 * `client` is the client instance making the authorization request.
 * `redirectURI` is the redirect URI specified by the client, and used as a
 * verifier in the subsequent access token exchange.  `user` is the
 * authenticated user approving the request.  `ares` is any additional
 * parameters parsed from the user's decision, including scope, duration of
 * access, etc.  `done` is called to issue an authorization code:
 *
 *     done(err, code)
 *
 * `code` is the code that will be sent to the client.  If an error occurs,
 * `done` should be invoked with `err` set in idomatic Node.js fashion.
 *
 * The code issued in this step will be used by the client in exchange for an
 * access token.  This code is bound to the client identifier and redirection
 * URI, which is included in the token request for verification.  The code is a
 * single-use token, and should expire shortly after it is issued (the maximum
 * recommended lifetime is 10 minutes).
 *
 * Options:
 *
 *     scopeSeparator  separator used to demarcate scope values (default: ' ')
 *
 * Examples:
 *
 *     server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
 *       AuthorizationCode.create(client.id, redirectURI, user.id, ares.scope, function(err, code) {
 *         if (err) { return done(err); }
 *         done(null, code);
 *       });
 *     }));
 *
 * References:
 *  - [Authorization Code](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-1.3.1)
 *  - [Authorization Code Grant](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-4.1)
 *
 * @param {Object} options
 * @param {Function} issue
 * @return {Object} module
 * @api public
 */
module.exports = function code(options, issue) {
  if (typeof options == 'function') {
    issue = options;
    options = undefined;
  }
  options = options || {};
  
  if (!issue) { throw new TypeError('oauth2orize.code grant requires an issue callback'); }
  
  var modes = options.modes || {};
  if (!modes.query) {
    modes.query = require('../response/query');
  }
  
  // For maximum flexibility, multiple scope spearators can optionally be
  // allowed.  This allows the server to accept clients that separate scope
  // with either space or comma (' ', ',').  This violates the specification,
  // but achieves compatibility with existing client libraries that are already
  // deployed.
  var separators = options.scopeSeparator || ' ';
  if (!Array.isArray(separators)) {
    separators = [ separators ];
  }
  
  
  /* Parse requests that request `code` as `response_type`.
   *
   * @param {http.ServerRequest} req
   * @api public
   */
  function request(req) {
    var clientID = req.query.client_id
      , redirectURI = req.query.redirect_uri
      , scope = req.query.scope
      , state = req.query.state;
      
    if (!clientID) { throw new AuthorizationError('Missing required parameter: client_id', 'invalid_request'); }
    
    if (scope) {

      if (typeof scope !== 'string') {
        throw new AuthorizationError('scope parameter must be a string', 'invalid_request');
      }

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
    };
  }
  
  /* Sends responses to transactions that request `code` as `response_type`.
   *
   * @param {Object} txn
   * @param {http.ServerResponse} res
   * @param {Function} next
   * @api public
   */
  function response(txn, res, next) {
    var mode = 'query'
      , respond;
    if (txn.req && txn.req.responseMode) {
      mode = txn.req.responseMode;
    }
    respond = modes[mode];
    
    if (!respond) {
      // http://lists.openid.net/pipermail/openid-specs-ab/Week-of-Mon-20140317/004680.html
      return next(new AuthorizationError('Unsupported response mode: ' + mode, 'unsupported_response_mode', null, 501));
    }
    if (respond && respond.validate) {
      try {
        respond.validate(txn);
      } catch(ex) {
        return next(ex);
      }
    }
    
    if (!txn.res.allow) {
      var params = { error: 'access_denied' };
      if (txn.req && txn.req.state) { params.state = txn.req.state; }
      return respond(txn, res, params);
    }
    
    function issued(err, code) {
      if (err) { return next(err); }
      if (!code) { return next(new AuthorizationError('Request denied by authorization server', 'access_denied')); }
      
      var params = { code: code };
      if (txn.req && txn.req.state) { params.state = txn.req.state; }
      return respond(txn, res, params);
    }
    
    // NOTE: The `redirect_uri`, if present in the client's authorization
    //       request, must also be present in the subsequent request to exchange
    //       the authorization code for an access token.  Acting as a verifier,
    //       the two values must be equal and serve to protect against certain
    //       types of attacks.  More information can be found here:
    //
    //       http://hueniverse.com/2011/06/oauth-2-0-redirection-uri-validation/
    
    try {
      var arity = issue.length;
      if (arity == 6) {
        issue(txn.client, txn.req.redirectURI, txn.user, txn.res, txn.req, issued);
      } else if (arity == 5) {
        issue(txn.client, txn.req.redirectURI, txn.user, txn.res, issued);
      } else { // arity == 4
        issue(txn.client, txn.req.redirectURI, txn.user, issued);
      }
    } catch (ex) {
      return next(ex);
    }
  }
  
  
  /**
   * Return `code` approval module.
   */
  var mod = {};
  mod.name = 'code';
  mod.request = request;
  mod.response = response;
  return mod;
};
