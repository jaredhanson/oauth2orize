module.exports = function(server, options) {
  options = options || {};
  
  if (!server) { throw new TypeError('oauth2orize.authorizationErrorHandler middleware requires a server argument'); }
  
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
    
    server._respondError(err, req.oauth2, res, function(err) {
      return next(err);
    });
  }
}
