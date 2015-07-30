/**
 * Module dependencies.
 */
var utils = require('../utils')
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
  
  if (!req.session) { return cb(new Error('OAuth2orize requires session support. Did you forget app.use(express.session(...))?')); }
  if (!req.session[key]) { return cb(new ForbiddenError('Unable to load OAuth 2.0 transactions from session')); }
  
  process.nextTick(function() {
    var query = req.query || {}
      , body = req.body || {}
      , tid = query[field] || body[field];
  
    if (!tid) { return cb(new BadRequestError('Missing required parameter: ' + field)); }
    var txn = req.session[key][tid];
    if (!txn) { return cb(new ForbiddenError('Unable to load OAuth 2.0 transaction: ' + tid)); }
    
    req.oauth2 = req.oauth2 || {};
    req.oauth2.transactionID = tid;
    
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
  var tid = utils.uid(lenTxnID);
  
  req.oauth2.transactionID = tid;
  // store transaction in session
  var txns = req.session[key] = req.session[key] || {};
  txns[tid] = txn;
  
  process.nextTick(cb);
}

SessionStore.prototype.remove = function(req, txn, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  
  var field = options.transactionField || 'transaction_id'
    , key = options.sessionKey || 'authorize';
  var tid = req.oauth2.transactionID;
  
  delete req.session[key][tid];
  delete req.oauth2.transactionID;
  if (Object.keys(req.oauth2).length == 0) {
    delete req.oauth2;
  }
  
  process.nextTick(cb);
}


module.exports = SessionStore;