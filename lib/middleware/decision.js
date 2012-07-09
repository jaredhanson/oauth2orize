/**
 * Module dependencies.
 */
var util = require('util')
  , AuthorizationError = require('../errors/authorizationerror');


/**
 * Handle authorization descisions from resource owners.
 *
 * Obtaining authorization via OAuth 2.0 consists of a sequence of discrete
 * steps.  First, the client requests authorization from the user (in this case
 * using an authorization server as an intermediary).  The authorization server
 * conducts an approval dialog with the user to obtain permission.  After access
 * has been allowed, a grant is issued to the client which can be exchanged for
 * an access token.
 *
 * This middleware is used to process a user's decision about whether to allow
 * or deny access.  The client that initiated the authorization transaction will
 * be sent a response, including a grant if access was allowed.
 *
 * The exact form of the grant will depend on the type requested by the client.
 * The `server`'s response handling functions are used to issue the grant and
 * send the response.   An application can implement support for these types as
 * necessary, including taking advantage of bundled grant middleware.
 *
 * Options:
 *
 *     cancelField    name of field that is set if user denied access (default: 'cancel')
 *     userProperty   property of `req` which contains the authenticated user (default: 'user')
 *     sessionKey     key under which transactions are stored in the session (default: 'authorize')
 *
 * @param {Server} server
 * @param {Object} options
 * @api protected
 */
module.exports = function descision(server, options, parse) {
  if (typeof options == 'function') {
    parse = options;
    options = {};
  }
  options = options || {};
  parse = parse || function(req, done) { return done(); };
  
  if (!server) throw new Error('OAuth 2.0 descision middleware requires a server instance.');
  
  var cancelField = options.cancelField || 'cancel'
    , userProperty = options.userProperty || 'user'
    , key = options.sessionKey || 'authorize';
  
  return function descision(req, res, next) {
    if (!req.session) { return next(new Error('OAuth 2.0 server requires session support.')); }
    if (!req.session[key]) { return next(new Error('Invalid OAuth 2.0 session key.')); }
    if (!req.body) { return next(new Error('OAuth 2.0 server requires body parsing.')); }
    if (!req.oauth2) { return next(new Error('OAuth 2.0 transaction not found.')); }
    
    parse(req, function(err, ares) {
      if (err) { return next(err); }
    
      var tid = req.oauth2.transactionID;
      req.oauth2.user = req[userProperty];
      req.oauth2.res = ares || {};
      
      if (req.oauth2.res.allow === undefined) {
        if (!req.body[cancelField]) { req.oauth2.res.allow = true; }
        else { req.oauth2.res.allow = false; }
      }
    
      // proxy end() to delete the transaction
      var end = res.end;
      res.end = function(chunk, encoding) {
        delete req.session[key][tid];
        res.end = end;
        res.end(chunk, encoding);
      }
      
      server._response(req.oauth2, res, function(err) {
        if (err) { return next(err); }
        return next(new AuthorizationError('invalid response type', 'unsupported_response_type'));
      });
    });
  }
}
