module.exports = function(server, options) {
  options = options || {};
  
  return function authorizationErrorHandler(err, req, res, next) {
    if (!req.oauth2) { return next(err); }
    
    // TODO: Proxy end to remove transaction, could be duplicate proxy so watch out
    
    server._respondError(err, req.oauth2, res, function(ierr) {
      if (ierr) { return next(ierr); }
      return next(err);
    });
  }
}
