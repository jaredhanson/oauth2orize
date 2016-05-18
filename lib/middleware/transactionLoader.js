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
  
  return function transactionLoader(req, res, next) {
    function loaded(err, txn) {
      if (err) { return next(err); }
      req.oauth2 = txn;
      next();
    }
    
    if (server._txnStore.legacy == true) {
      server._txnStore.load(server, options, req, loaded);
    }
  };
};
