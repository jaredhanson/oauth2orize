module.exports = function(server, options) {
  options = options || {};
  
  return function authorizationErrorHandler(err, req, res, next) {
    if (!req.oauth2) { return next(err); }
    
    // proxy end() to delete the transaction
    if (!req.oauth2._endProxied) {
      var end = res.end;
      res.end = function(chunk, encoding) {
        if (server._txnStore.legacy == true) {
          server._txnStore.remove(options, req, req.oauth2.transactionID, function noop(){});
        }
      
        res.end = end;
        res.end(chunk, encoding);
      };
    }
    
    server._respondError(err, req.oauth2, res, function(ierr) {
      if (ierr) { return next(ierr); }
      return next(err);
    });
  }
}