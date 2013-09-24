/**
 * Module dependencies.
 */
var AuthorizationError = require('../errors/authorizationerror')
  , BadRequestError = require('../errors/badrequesterror')
  , ForbiddenError = require('../errors/forbiddenerror');


/**
 * Loads an OAuth 2.0 authorization transaction from the session.
 *
 * This middleware is used to load a pending OAuth 2.0 transaction that is
 * serialized into the session.  In most circumstances, this is transparently
 * done prior to processing a user's decision with `decision` middleware, and an
 * implementation shouldn't need to mount this middleware explicitly.
 *
 * Options:
 *
 *     transactionField  name of field that contains the transaction ID (default: 'transaction_id')
 *     sessionKey        key under which transactions are stored in the session (default: 'authorize')
 *
 * @param {Server} server
 * @param {Object} options
 * @return {Function}
 * @api protected
 */
module.exports = function(server, options) {
  options = options || {};
  
  if (!server) { throw new TypeError('oauth2orize.transactionLoader middleware requires a server argument'); }
  
  var field = options.transactionField || 'transaction_id'
    , key = options.sessionKey || 'authorize';
  
  return function transactionLoader(req, res, next) {
    if (!req.session) { return next(new Error('OAuth2orize requires session support. Did you forget app.use(express.session(...))?')); }
    if (!req.session[key]) { return next(new ForbiddenError('Unable to load OAuth 2.0 transactions from session')); }
    
    var query = req.query || {}
      , body = req.body || {}
      , tid = query[field] || body[field];
    
    if (!tid) { return next(new BadRequestError('Missing required parameter: ' + field)); }
    var txn = req.session[key][tid];
    if (!txn) { return next(new ForbiddenError('Unable to load OAuth 2.0 transaction: ' + tid)); }
    
    server.deserializeClient(txn.client, function(err, client) {
      if (err) { return next(err); }
      if (!client) {
        // At the time the request was initiated, the client was validated.
        // Since then, however, it has been invalidated.  The transaction will
        // be invalidated and no response will be sent to the client.
        delete req.session[key][tid];
        return next(new AuthorizationError('Unauthorized client', 'unauthorized_client'));
      }
      
      req.oauth2 = {};
      req.oauth2.transactionID = tid;
      req.oauth2.client = client;
      req.oauth2.redirectURI = txn.redirectURI;
      req.oauth2.req = txn.req;
      next();
    });
  };
};
