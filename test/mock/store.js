function MockStore(store) {
  this._store = store;
}

MockStore.prototype.load = function(req, cb) {
}

MockStore.prototype.store = function(req, txn, cb) {
  req.__mock_store__ = {};
  req.__mock_store__.txn = txn;
  process.nextTick(function() {
    cb(null, 'mocktxn-1')
  });
}

MockStore.prototype.remove = function(req, h, cb) {
}


module.exports = MockStore;
