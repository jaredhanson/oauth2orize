/**
 * Module dependencies.
 */
var utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror')
  , BadRequestError = require('../errors/badrequesterror')
  , ForbiddenError = require('../errors/forbiddenerror');


function SessionStore() {
  this.legacy = true;
}

SessionStore.prototype.load = function(server, options, req, cb) {
  var field = options.transactionField || 'transaction_id'
    , key = options.sessionKey || 'authorize';
  
  if (!req.session) { return cb(new Error('OAuth2orize requires session support. Did you forget app.use(express.session(...))?')); }
  if (!req.session[key]) { return cb(new ForbiddenError('Unable to load OAuth 2.0 transactions from session')); }
  
  var query = req.query || {}
    , body = req.body || {}
    , tid = query[field] || body[field];

  if (!tid) { return cb(new BadRequestError('Missing required parameter: ' + field)); }
  var txn = req.session[key][tid];
  if (!txn) { return cb(new ForbiddenError('Unable to load OAuth 2.0 transaction: ' + tid)); }
  
  var self = this;
  server.deserializeClient(txn.client, function(err, client) {
    if (err) { return cb(err); }
    if (!client) {
      // At the time the request was initiated, the client was validated.
      // Since then, however, it has been invalidated.  The transaction will
      // be invalidated and no response will be sent to the client.
      self.remove(options, req, tid, function(err) {
        if (err) { return cb(err); }
        return cb(new AuthorizationError('Unauthorized client', 'unauthorized_client'));
      });
      return;
    }
  
    txn.transactionID = tid;
    txn.client = client;
    cb(null, txn);
  });
}

SessionStore.prototype.store = function(server, options, req, txn, cb) {
  var lenTxnID = options.idLength || 8
    , key = options.sessionKey || 'authorize';
  
  server.serializeClient(txn.client, function(err, obj) {
    if (err) { return cb(err); }
    
    var tid = utils.uid(lenTxnID);
    txn.client = obj;
  
    // store transaction in session
    var txns = req.session[key] = req.session[key] || {};
    txns[tid] = txn;
  
    cb(null, tid);
  });
}

SessionStore.prototype.update = function(server, options, req, tid, txn, cb) {
  var key = options.sessionKey || 'authorize';
  
  server.serializeClient(txn.client, function(err, obj) {
    if (err) { return cb(err); }
    
    txn.client = obj;
  
    // store transaction in session
    var txns = req.session[key] = req.session[key] || {};
    txns[tid] = txn;
  
    cb(null);
  });
}

SessionStore.prototype.remove = function(options, req, tid, cb) {
  var key = options.sessionKey || 'authorize';
  
  if (!req.session) { return cb(new Error('OAuth2orize requires session support. Did you forget app.use(express.session(...))?')); }
  
  if (req.session[key]) {
    delete req.session[key][tid];
  }
  
  cb();
}


module.exports = SessionStore;
