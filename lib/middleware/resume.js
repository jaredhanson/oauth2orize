/**
 * Module dependencies.
 */
var utils = require('../utils')
  , AuthorizationError = require('../errors/authorizationerror');


module.exports = function(server, options, immediate) {
  if (typeof options == 'function') {
    immediate = options;
    options = undefined;
  }
  options = options || {};
  
  if (!server) { throw new TypeError('oauth2orize.resume middleware requires a server argument'); }
  if (!immediate) { throw new TypeError('oauth2orize.resume middleware requires an immediate function'); }
  
  var userProperty = options.userProperty || 'user';
  
  return function resume(req, res, next) {
    if (!req.oauth2) { return next(new Error('OAuth2orize requires transaction support. Did you forget oauth2orize.transactionLoader(...)?')); }
    
    req.oauth2.user = req[userProperty];
    
    function immediated(err, allow, info, locals) {
      if (err) { return next(err); }
      if (allow) {
        req.oauth2.res = info || {};
        req.oauth2.res.allow = true;
        if (locals) {
          req.oauth2.locals = req.oauth2.locals || {};
          utils.merge(req.oauth2.locals, locals);
        }
        
        // proxy end() to delete the transaction
        var end = res.end;
        res.end = function(chunk, encoding) {
          if (server._txnStore.legacy == true) {
            server._txnStore.remove(options, req, req.oauth2.transactionID, function noop(){});
          }
    
          res.end = end;
          res.end(chunk, encoding);
        };

        server._respond(req.oauth2, res, function(err) {
          if (err) { return next(err); }
          return next(new AuthorizationError('Unsupported response type: ' + req.oauth2.req.type, 'unsupported_response_type'));
        });
      } else {
        req.oauth2.info = info;
        if (locals) {
          req.oauth2.locals = req.oauth2.locals || {};
          utils.merge(req.oauth2.locals, locals);
        }
        
        function updated(err) {
          if (err) { return next(err); }
          next();
        }
        
        if (server._txnStore.legacy == true) {
          var txn = {};
          txn.protocol = 'oauth2';
          txn.client = req.oauth2.client;
          txn.redirectURI = req.oauth2.redirectURI;
          txn.req = req.oauth2.req;
          txn.info = info;
          
          server._txnStore.update(server, options, req, req.oauth2.transactionID, txn, updated);
        }
      }
    }
    
    try {
      var arity = immediate.length;
      if (arity == 4) {
        immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, immediated);
      } else if (arity == 5) {
        immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, req.oauth2.req.type, immediated);
      } else if (arity == 6) {
        immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, req.oauth2.req.type, req.oauth2.req, immediated);
      } else if (arity == 7) {
        immediate(req.oauth2.client, req.oauth2.user, req.oauth2.req.scope, req.oauth2.req.type, req.oauth2.req, req.oauth2.locals, immediated);
      } else { // arity == 3
        immediate(req.oauth2.client, req.oauth2.user, immediated);
      }
    } catch (ex) {
      return next(ex);
    }
  };
};
