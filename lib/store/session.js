/**
 * Module dependencies.
 */
var utils = require('../utils');


function SessionStore() {
  
}

SessionStore.prototype.load = function(req, options, cb) {
  if (typeof options == 'function') {
    cb = options;
    options = undefined;
  }
  options = options || {};
  
  process.nextTick(function() {
    return cb(null, { foo: 'bar' });
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