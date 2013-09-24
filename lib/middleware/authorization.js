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
module.exports = function(server, options, validate, immediate) {
  if (typeof options == 'function') {
    immediate = validate;
    validate = options;
    options = undefined;
  }
  options = options || {};
  immediate = immediate || function (client, user, done) { return done(null, false); };
  
  if (!server) { throw new TypeError('oauth2orize.authorization middleware requires a server argument'); }
  if (!validate) { throw new TypeError('oauth2orize.authorization middleware requires a validate function'); }
  
  var lenTxnID = options.idLength || 8
    , userProperty = options.userProperty || 'user'
    , key = options.sessionKey || 'authorize';
  
  return function authorization(req, res, next) {
    if (!req.session) { return next(new Error('OAuth2orize requires session support. Did you forget app.use(express.session(...))?')); }
    
    var body = req.body || {}
      , type = req.query.response_type || body.response_type;

    server._parse(type, req, function(err, areq) {
      if (err) { return next(err); }
      if (!areq || !Object.keys(areq).length) { return next(new AuthorizationError('Missing required parameter: response_type', 'invalid_request')); }
      if (Object.keys(areq).length == 1 && areq.type) { return next(new AuthorizationError('Unsupported response type: ' + type, 'unsupported_response_type')); }
      
      function validated(err, client, redirectURI) {
        // Set properties *before* next()'ing due to error.  The presence of a
        // redirectURI being provided, even under error conditions, indicates
        // that the client should be informed of the error via a redirect.
        req.oauth2 = {};
        if (client) { req.oauth2.client = client; }
        if (redirectURI) { req.oauth2.redirectURI = redirectURI; }
        
        if (err) { return next(err); }
        if (!client) { return next(new AuthorizationError('Unauthorized client', 'unauthorized_client')); }

        req.oauth2.req = areq;
        req.oauth2.user = req[userProperty];

        function immediated(err, allow, ares) {
          if (err) { return next(err); }
          if (allow) {
            req.oauth2.res = ares || {};
            req.oauth2.res.allow = true;

            server._respond(req.oauth2, res, function(err) {
              if (err) { return next(err); }
              return next(new AuthorizationError('Unsupported response type: ' + req.oauth2.req.type, 'unsupported_response_type'));
            });
          } else {
            // A dialog needs to be conducted to obtain the user's approval.
            // Serialize a transaction to the session.  The transaction will be
            // restored (and removed) from the session when the user allows or
            // denies the request.
            server.serializeClient(client, function(err, obj) {
              if (err) { return next(err); }

              var tid = utils.uid(lenTxnID);
              req.oauth2.transactionID = tid;

              var txn = {};
              txn.protocol = 'oauth2';
              txn.client = obj;
              txn.redirectURI = redirectURI;
              txn.req = areq;
              // store transaction in session
              var txns = req.session[key] = req.session[key] || {};
              txns[tid] = txn;

              next();
            });
          }
        }

        var arity = immediate.length;
        if (arity == 4) {
          immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, immediated);
        } else { // arity == 3
          immediate(req.oauth2.client, req.oauth2.user, immediated);
        }
      }
      
      try {
        var arity = validate.length;
        if (arity == 3) {
          validate(areq.clientID, areq.redirectURI, validated);
        } else if (arity == 4) {
          validate(areq.clientID, areq.redirectURI, areq.scope, validated);
        } else if (arity == 5) {
          validate(areq.clientID, areq.redirectURI, areq.scope, areq.type, validated);
        } else { // arity == 2
          validate(areq, validated);
        }
      } catch (ex) {
        return next(ex);
      }
    });
  };
};
