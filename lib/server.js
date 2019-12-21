/**
 * Module dependencies.
 */
var SessionStore = require('./txn/session')
  , UnorderedList = require('./unorderedlist')
  , authorization = require('./middleware/authorization')
  , resume = require('./middleware/resume')
  , decision = require('./middleware/decision')
  , transactionLoader = require('./middleware/transactionLoader')
  , token = require('./middleware/token')
  , authorizationErrorHandler = require('./middleware/authorizationErrorHandler')
  , errorHandler = require('./middleware/errorHandler')
  , utils = require('./utils')
  , debug = require('debug')('oauth2orize');


/**
 * `Server` constructor.
 *
 * @api public
 */
function Server(options) {
  options = options || {};
  this._reqParsers = [];
  this._resHandlers = [];
  this._errHandlers = [];
  this._exchanges = [];

  this._serializers = [];
  this._deserializers = [];
  this._txnStore = options.store || new SessionStore();
}

/**
 * Register authorization grant middleware.
 *
 * OAuth 2.0 defines an authorization framework, in which authorization grants
 * can be of a variety of types.  Initiating and responding to an OAuth 2.0
 * authorization transaction is implemented by grant middleware, and the server
 * registers the middleware it wishes to support.
 *
 * Examples:
 *
 *     server.grant(oauth2orize.grant.code());
 *
 *     server.grant('*', function(req) {
 *       return { host: req.headers['host'] }
 *     });
 *
 *     server.grant('foo', function(req) {
 *       return { foo: req.query['foo'] }
 *     });
 *
 * @param {String|Object} type
 * @param {String} phase
 * @param {Function} fn
 * @return {Server} for chaining
 * @api public
 */
Server.prototype.grant = function(type, phase, fn) {
  if (typeof type == 'object') {
    // sig: grant(mod)
    var mod = type;
    if (mod.request) { this.grant(mod.name, 'request', mod.request); }
    if (mod.response) { this.grant(mod.name, 'response', mod.response); }
    if (mod.error) { this.grant(mod.name, 'error', mod.error); }
    return this;
  }
  if (typeof phase == 'object') {
    // sig: grant(type, mod)
    var mod = phase;
    if (mod.request) { this.grant(type, 'request', mod.request); }
    if (mod.response) { this.grant(type, 'response', mod.response); }
    if (mod.error) { this.grant(type, 'error', mod.error); }
    return this;
  }
  
  if (typeof phase == 'function') {
    // sig: grant(type, fn)
    fn = phase;
    phase = 'request';
  }
  if (type === '*') { type = null; }
  if (type) { type = new UnorderedList(type); }
  
  if (phase == 'request') {
    debug('register request parser %s %s', type || '*', fn.name || 'anonymous');
    this._reqParsers.push({ type: type, handle: fn });
  } else if (phase == 'response') {
    debug('register response handler %s %s', type || '*', fn.name || 'anonymous');
    this._resHandlers.push({ type: type, handle: fn });
  } else if (phase == 'error') {
    debug('register error handler %s %s', type || '*', fn.name || 'anonymous');
    this._errHandlers.push({ type: type, handle: fn });
  }
  return this;
};

/**
 * Register token exchange middleware.
 *
 * OAuth 2.0 defines an authorization framework, in which authorization grants
 * can be of a variety of types.  Exchanging of these types for access tokens is
 * implemented by exchange middleware, and the server registers the middleware
 * it wishes to support.
 *
 * Examples:
 *
 *     server.exchange(oauth2orize.exchange.authorizationCode(function() {
 *       ...
 *     }));
 *
 * @param {String|Function} type
 * @param {Function} fn
 * @return {Server} for chaining
 * @api public
 */
Server.prototype.exchange = function(type, fn) {
  if (typeof type == 'function') {
    fn = type;
    type = fn.name;
  }
  if (type === '*') { type = null; }
  
  debug('register exchanger %s %s', type || '*', fn.name || 'anonymous');
  this._exchanges.push({ type: type, handle: fn });
  return this;
};

/**
 * Parses requests to obtain authorization.
 *
 * @api public
 */
Server.prototype.authorize =
Server.prototype.authorization = function(options, validate, immediate, complete) {
  return authorization(this, options, validate, immediate, complete);
};

Server.prototype.resume = function(options, immediate, complete) {
  var loader;
  if (typeof options == 'function' && typeof immediate == 'function' && typeof complete == 'function') {
    options = { loadTransaction: options };
  }
  
  if (options && options.loadTransaction === false) {
    return resume(this, options, immediate, complete);
  }
  if (options && typeof options.loadTransaction === 'function') {
    loader = options.loadTransaction;
  } else {
    loader = transactionLoader(this, options);
  }
  return [loader, resume(this, options, immediate, complete)];
};

/**
 * Handle a user's response to an authorization dialog.
 *
 * @api public
 */
Server.prototype.decision = function(options, parse, complete) {
  if (options && options.loadTransaction === false) {
    return decision(this, options, parse, complete);
  }
  return [transactionLoader(this, options), decision(this, options, parse, complete)];
};

Server.prototype.authorizeError =
Server.prototype.authorizationError =
Server.prototype.authorizationErrorHandler = function(options) {
  var loader = transactionLoader(this, options);
  
  return [
    function transactionLoaderErrorWrapper(err, req, res, next) {
      loader(req, res, function(ierr) {
        return next(err);
      });
    },
    authorizationErrorHandler(this, options)
  ];
};

/**
 * Handle requests to exchange an authorization grant for an access token.
 *
 * @api public
 */
Server.prototype.token = function(options) {
  return token(this, options);
};

/**
 * Respond to errors encountered in OAuth 2.0 endpoints.
 *
 * @api public
 */
Server.prototype.errorHandler = function(options) {
  return errorHandler(options);
};

/**
 * Registers a function used to serialize client objects into the session.
 *
 * Examples:
 *
 *     server.serializeClient(function(client, done) {
 *       done(null, client.id);
 *     });
 *
 * @api public
 */
Server.prototype.serializeClient = function(fn, done) {
  if (typeof fn === 'function') {
    return this._serializers.push(fn);
  }
  
  // private implementation that traverses the chain of serializers, attempting
  // to serialize a client
  var client = fn;
  
  var stack = this._serializers;
  (function pass(i, err, obj) {
    // serializers use 'pass' as an error to skip processing
    if ('pass' === err) { err = undefined; }
    // an error or serialized object was obtained, done
    if (err || obj) { return done(err, obj); }
    
    var layer = stack[i];
    if (!layer) {
      return done(new Error('Failed to serialize client. Register serialization function using serializeClient().'));
    }
    
    try {
      layer(client, function(e, o) { pass(i + 1, e, o); } );
    } catch (ex) {
      return done(ex);
    }
  })(0);
};

/**
 * Registers a function used to deserialize client objects out of the session.
 *
 * Examples:
 *
 *     server.deserializeClient(function(id, done) {
 *       Client.findById(id, function (err, client) {
 *         done(err, client);
 *       });
 *     });
 *
 * @api public
 */
Server.prototype.deserializeClient = function(fn, done) {
  if (typeof fn === 'function') {
    return this._deserializers.push(fn);
  }
  
  // private implementation that traverses the chain of deserializers,
  // attempting to deserialize a client
  var obj = fn;
  
  var stack = this._deserializers;
  (function pass(i, err, client) {
    // deserializers use 'pass' as an error to skip processing
    if ('pass' === err) { err = undefined; }
    // an error or deserialized client was obtained, done
    if (err || client) { return done(err, client); }
    // a valid client existed when establishing the session, but that client has
    // since been deauthorized
    if (client === null || client === false) { return done(null, false); }
    
    var layer = stack[i];
    if (!layer) {
      return done(new Error('Failed to deserialize client. Register deserialization function using deserializeClient().'));
    }
    
    try {
      layer(obj, function(e, c) { pass(i + 1, e, c); } );
    } catch (ex) {
      return done(ex);
    }
  })(0);
};


/**
 * Parse authorization request into transaction using registered grant middleware. 
 *
 * @param {String} type
 * @param {http.ServerRequest} req
 * @param {Function} cb
 * @api private
 */
Server.prototype._parse = function(type, req, cb) {
  var ultype = new UnorderedList(type)
    , stack = this._reqParsers
    , areq = {};
  
  if (type) { areq.type = type; }
  
  (function pass(i) {
    var layer = stack[i];
    if (!layer) { return cb(null, areq); }
    
    try {
      debug('parse:%s', layer.handle.name || 'anonymous');
      if (layer.type === null || layer.type.equalTo(ultype)) {
        var arity = layer.handle.length;
        if (arity == 1) { // sync
          var o = layer.handle(req);
          utils.merge(areq, o);
          pass(i + 1);
        } else { // async
          layer.handle(req, function(err, o) {
            if (err) { return cb(err); }
            utils.merge(areq, o);
            pass(i + 1);
          });
        }
      } else {
        pass(i + 1);
      }
    } catch (ex) {
      return cb(ex);
    }
  })(0);
};

/**
 * Respond to authorization transaction using registered grant middleware. 
 *
 * @param {Object} txn
 * @param {http.ServerResponse} res
 * @param {Function} cb
 * @api private
 */
Server.prototype._respond = function(txn, res, complete, cb) {
  if (cb === undefined) {
    cb = complete;
    complete = undefined;
  }
  complete = complete || function(cb) { cb(); }
  
  var ultype = new UnorderedList(txn.req.type)
    , stack = this._resHandlers
    , idx = 0;
  
  function next(err) {
    if (err) { return cb(err); }
    
    var layer = stack[idx++];
    if (!layer) { return cb(); }
    
    try {
      debug('respond:%s', layer.handle.name || 'anonymous');
      if (layer.type === null || layer.type.equalTo(ultype)) {
        var arity = layer.handle.length;
        if (arity == 4) {
          layer.handle(txn, res, complete, next);
        } else {
          layer.handle(txn, res, next);
        }
      } else {
        next();
      }
    } catch (ex) {
      return cb(ex);
    }
  }
  next();
};

Server.prototype._respondError = function(err, txn, res, cb) {
  var ultype = new UnorderedList(txn.req.type)
    , stack = this._errHandlers
    , idx = 0;
    
  function next(err) {
    var layer = stack[idx++];
    if (!layer) { return cb(err); }
  
    try {
      debug('error:%s', layer.handle.name || 'anonymous');
      if (layer.type === null || layer.type.equalTo(ultype)) {
        layer.handle(err, txn, res, next);
      } else {
        next(err);
      }
    } catch (ex) {
      return cb(ex);
    }
  }
  next(err);
}

/**
 * Process token request using registered exchange middleware. 
 *
 * @param {String} type
 * @param {http.ServerRequest} req
 * @param {http.ServerResponse} res
 * @param {Function} cb
 * @api private
 */
Server.prototype._exchange = function(type, req, res, cb) {
  var stack = this._exchanges
    , idx = 0;
  
  function next(err) {
    if (err) { return cb(err); }
    
    var layer = stack[idx++];
    if (!layer) { return cb(); }
    
    try {
      debug('exchange:%s', layer.handle.name || 'anonymous');
      if (layer.type === null || layer.type === type) {
        layer.handle(req, res, next);
      } else {
        next();
      }
    } catch (ex) {
      return cb(ex);
    }
  }
  next();
};


/**
 * Expose `Server`.
 */
exports = module.exports = Server;
