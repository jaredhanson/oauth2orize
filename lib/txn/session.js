/**
 * Module dependencies.
 */
var utils = require('../utils')
  , BadRequestError = require('../errors/badrequesterror')
  , ForbiddenError = require('../errors/forbiddenerror');


function SessionStore() {
  this._key = 'authorize';
  this._field = 'transaction_id';
  this._idLength = 8;
}

SessionStore.prototype.setOptions = function(options) {
  options = options || {};
  
  this._key = options.sessionKey || 'authorize';
  this._field = options.transactionField || 'transaction_id';
  this._idLength = options.idLength || 8;
}

SessionStore.prototype.load = function(req, cb) {
  var field = this._field
    , key = this._key;
  
  if (!req.session) { return cb(new Error('OAuth2orize requires session support. Did you forget app.use(express.session(...))?')); }
  if (!req.session[key]) { return cb(new ForbiddenError('Unable to load OAuth 2.0 transactions from session')); }
  
  process.nextTick(function() {
    var query = req.query || {}
      , body = req.body || {}
      , tid = query[field] || body[field];
  
    if (!tid) { return cb(new BadRequestError('Missing required parameter: ' + field)); }
    var txn = req.session[key][tid];
    if (!txn) { return cb(new ForbiddenError('Unable to load OAuth 2.0 transaction: ' + tid)); }
    
    txn.id = tid;
    
    return cb(null, txn);
  });
}

SessionStore.prototype.store = function(req, txn, cb) {
  var lenTxnID = this._idLength
    , key = this._key;
  var tid = utils.uid(lenTxnID);
  
  // store transaction in session
  var txns = req.session[key] = req.session[key] || {};
  txns[tid] = txn;
  
  cb(null, tid);
}

SessionStore.prototype.remove = function(req, txn, cb) {
  var key = this._key;
  var tid = txn.transactionID;
  
  if (req.session[key]) {
    delete req.session[key][tid];
  }

  delete req.oauth2.transactionID;
  if (Object.keys(req.oauth2).length == 0) {
    delete req.oauth2;
  }
  
  cb();
}


module.exports = SessionStore;
