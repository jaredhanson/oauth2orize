/**
 * Module dependencies.
 */
var utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror');


/**
 * Handle authorization requests from OAuth 2.0 clients.
 *
 * Obtaining authorization via OAuth 2.0 consists of a sequence of discrete
 * steps.  First, the client requests authorization from the user (in this case
 * using an authorization server as an intermediary).  The authorization server
 * conducts an approval dialog with the user to obtain permission.  After access
 * has been allowed, a grant is issued to the client which can be exchanged for
 * an access token.
 *
 * This middleware is used to initiate authorization transactions.  If a request
 * is parsed and validated, the following properties will be available on the
 * request:
 *
 *     req.oauth2.transactionID  an ID assigned to this transaction
 *     req.oauth2.client         client requesting the user's authorization
 *     req.oauth2.redirectURI    URL to redirect the user to after authorization
 *     req.oauth2.req            parameters from request made by the client
 *
 * The contents of `req.oauth2.req` depends on the grant type requested by the
 * the client.  The `server`'s request parsing functions are used to construct
 * this object, and the application can implement support for these types as
 * necessary, taking advantage of bundled grant middleware.
 *
 * Because the approval dialog may be conducted over a series of requests and
 * responses, a transaction is also stored in the session until a decision is
 * reached.  The application is responsible for verifying the user's identity
 * and prompting him or her to allow or deny the request (typically via an HTML
 * form).  At that point, `decision` middleware can be utilized to process the
 * user's decision and issue the grant to the client.
 *
 * Callbacks:
 *
 * This middleware requires a `validate` callback, for which the function
 * signature is as follows:
 *
 *     function(clientID, redirectURI, done) { ... }
 *
 * `clientID` is the client identifier and `redirectURI` is the redirect URI as
 * indicated by the client.  If the request is valid, `done` must be invoked
 * with the following signature:
 *
 *     done(err, client, redirectURI);
 *
 * `client` is the client instance which is making the request.  `redirectURI`
 * is the URL to which the user will be redirected after authorization is
 * obtained (which may be different, if the server is enforcing registration
 * requirements).  If an error occurs, `done` should be invoked with `err` set
 * in idomatic Node.js fashion.
 *
 * Alternate function signatures of the `validate` callback are available if
 * needed.  Consult the source code for a definitive reference.
 *
 *
 * Note that authorization may be obtained by the client directly from the user
 * without using an authorization server as an intermediary (for example, when
 * obtaining a grant in the form of the user's password credentials).  In these
 * cases, the client interacts only with the token endpoint without any need to
 * interact with the authorization endpoint.
 *
 * Options:
 *
 *     idLength    length of generated transaction IDs (default: 8)
 *     sessionKey  key under which transactions are stored in the session (default: 'authorize')
 *
 * Examples:
 *
 *     app.get('/dialog/authorize',
 *       login.ensureLoggedIn(),
 *       server.authorization(function(clientID, redirectURI, done) {
 *         Clients.findOne(clientID, function(err, client) {
 *           if (err) { return done(err); }
 *           if (!client) { return done(null, false); }
 *           return done(null, client, client.redirectURI);
 *         });
 *       }),
 *       function(req, res) {
 *         res.render('dialog', { transactionID: req.oauth2.transactionID,
 *                                user: req.user, client: req.oauth2.client });
 *       });
 *
 * References:
 *  - [Authorization Endpoint](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-3.1)
 *
 * @param {Server} server
 * @param {Object} options
 * @param {Function} validate
 * @return {Function}
 * @api protected
 */
module.exports = function(server, options, validate, immediate, complete) {
  if (typeof options == 'function') {
    complete = immediate;
    immediate = validate;
    validate = options;
    options = undefined;
  }
  options = options || {};
  immediate = immediate || function (client, user, done) { return done(null, false); };
  
  if (!server) { throw new TypeError('oauth2orize.authorization middleware requires a server argument'); }
  if (!validate) { throw new TypeError('oauth2orize.authorization middleware requires a validate function'); }
  
  var userProperty = options.userProperty || 'user';
  
  return function authorization(req, res, next) {
    
    var body = req.body || {}
      , type = req.query.response_type || body.response_type;

    server._parse(type, req, function(err, areq) {
      if (err) { return next(err); }
      if (!areq || !areq.type) { return next(new AuthorizationError('Missing required parameter: response_type', 'invalid_request')); }
      if (areq.type && !areq.clientID) { return next(new AuthorizationError('Unsupported response type: ' + type, 'unsupported_response_type')); }
      
      function validated(err, client, redirectURI) {
        // Set properties *before* next()'ing due to error.  The presence of a
        // redirectURI being provided, even under error conditions, indicates
        // that the client should be informed of the error via a redirect.
        req.oauth2 = {};
        if (client) { req.oauth2.client = client; }
        if (redirectURI) { req.oauth2.redirectURI = redirectURI; }
        req.oauth2.req = areq;
        req.oauth2.user = req[userProperty];
        if (req.locals) { req.oauth2.locals = req.locals; }

        if (err) { return next(err); }
        if (!client) { return next(new AuthorizationError('Unauthorized client', 'unauthorized_client')); }

        function immediated(err, allow, info, locals) {
          if (err) { return next(err); }
          if (allow) {
            req.oauth2.res = info || {};
            req.oauth2.res.allow = true;
            if (locals) {
              req.oauth2.locals = req.oauth2.locals || {};
              utils.merge(req.oauth2.locals, locals);
            }
            
            function completing(cb) {
              if (!complete) { return cb(); }
              complete(req, req.oauth2, cb);
            }

            server._respond(req.oauth2, res, completing, function(err) {
              if (err) { return next(err); }
              return next(new AuthorizationError('Unsupported response type: ' + req.oauth2.req.type, 'unsupported_response_type'));
            });
          } else {
            // Add info and locals to `req.oauth2`, where they will be
            // available to the next middleware.  Since this is a
            // non-immediate response, the next middleware's responsibility is
            // to prompt the user to allow or deny access.  `info` and
            // `locals` are passed along as they may be of assistance when
            // rendering the prompt.
            //
            // Note that, when using the legacy transaction store, `info` is
            // also serialized into the transaction, where it can further be
            // utilized in the `decision` middleware after the user submits the
            // prompt's form.  As such, `info` should be a normal JSON object,
            // so that it can be correctly serialized into the session.
            // `locals` is only carried through to the middleware chain for the
            // current request, so it may contain instantiated classes that
            // don't serialize cleanly.
            //
            // The transaction store is pluggable when initializing the `Server`
            // instance.  If an application implements a custom transaction
            // store, the specific details of what properties are serialized
            // into the transaction and loaded on subsequent requests are
            // determined by the implementation.
            req.oauth2.info = info;
            if (locals) {
              req.oauth2.locals = req.oauth2.locals || {};
              utils.merge(req.oauth2.locals, locals);
            }
            
            // A dialog needs to be conducted to obtain the user's approval.
            // Serialize a transaction to the session.  The transaction will be
            // restored (and removed) from the session when the user allows or
            // denies the request.
            function stored(err, tid) {
              if (err) { return next(err); }
              req.oauth2.transactionID = tid;
              next();
            }
            
            if (server._txnStore.legacy == true) {
              var txn = {};
              txn.protocol = 'oauth2';
              txn.client = client;
              txn.redirectURI = redirectURI;
              txn.req = areq;
              txn.info = info;
              
              server._txnStore.store(server, options, req, txn, stored);
            } else {
              server._txnStore.store(req, req.oauth2, stored);
            }
          }
        }

        var arity = immediate.length;
        if (arity == 7) {
          immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, req.oauth2.req.type, req.oauth2.req, req.oauth2.locals, immediated);
        } else if (arity == 6) {
          immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, req.oauth2.req.type, req.oauth2.req, immediated);
        } else if (arity == 5) {
          immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, req.oauth2.req.type, immediated);
        } else if (arity == 4) {
          immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, immediated);
        } else { // arity == 3
          immediate(req.oauth2.client, req.oauth2.user, immediated);
        }
      }
      
      try {
        var arity = validate.length;
        if (arity == 5) {
          validate(areq.clientID, areq.redirectURI, areq.scope, areq.type, validated);
        } else if (arity == 4) {
          validate(areq.clientID, areq.redirectURI, areq.scope, validated);
        } else if (arity == 3) {
          validate(areq.clientID, areq.redirectURI, validated);
        } else { // arity == 2
          validate(areq, validated);
        }
      } catch (ex) {
        return next(ex);
      }
    });
  };
};
