/**
 * Module dependencies.
 */
var utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror')
  , BadRequestError = require('../errors/badrequesterror')
  , ForbiddenError = require('../errors/forbiddenerror');


function SessionStore() {
  
}

SessionStore.prototype.load = function(req, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  
  var field = options.transactionField || 'transaction_id'
    , key = options.sessionKey || 'authorize';
  
  process.nextTick(function() {
    var query = req.query || {}
      , body = req.body || {}
      , tid = query[field] || body[field];
  
    if (!tid) { return cb(new BadRequestError('Missing required parameter: ' + field)); }
    var txn = req.session[key][tid];
    if (!txn) { return cb(new ForbiddenError('Unable to load OAuth 2.0 transaction: ' + tid)); }
    
    return cb(null, txn);
  });
}

SessionStore.prototype.store = function(req, txn, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  
  var lenTxnID = options.idLength || 8
    , key = options.sessionKey || 'authorize';
  
  key = 'authFoo';
  
  var tid = utils.uid(lenTxnID);
  //req.oauth2.transactionID = tid;
  
  // store transaction in session
  var txns = req.session[key] = req.session[key] || {};
  txns[tid] = txn;
  
  process.nextTick(cb);
}


module.exports = SessionStore;