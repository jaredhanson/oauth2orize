function MockStore(store) {
  this._store = store;
}

MockStore.prototype.load = function(req, cb) {
  process.nextTick(function() {
    cb(null, { transactionID: req.body.state, redirectURI: 'http://www.example.com/auth/callback' })
  });
}

MockStore.prototype.store = function(req, txn, cb) {
  req.__mock_store__ = {};
  req.__mock_store__.txn = txn;
  process.nextTick(function() {
    cb(null, 'mocktxn-1')
  });
}

MockStore.prototype.update = function(req, h, txn, cb) {
  req.__mock_store__ = {};
  req.__mock_store__.uh = h;
  req.__mock_store__.utxn = txn;
  process.nextTick(function() {
    cb(null, 'mocktxn-1u')
  });
}

MockStore.prototype.remove = function(req, h, cb) {
  req.__mock_store__ = {};
  req.__mock_store__.removed = h;
  process.nextTick(function() {
    cb(null)
  });
}


module.exports = MockStore;
