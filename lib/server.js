/**
 * Module dependencies.
 */
var utils = require('./utils')
  , UnorderedList = require('./unorderedlist')
  , authorization = require('./middleware/authorization')
  , decision = require('./middleware/decision')
  , transactionLoader = require('./middleware/transactionLoader')
  , token = require('./middleware/token')
  , errorHandler = require('./middleware/errorHandler')
  , debug = require('debug')('oauth2orize');


/**
 * `Server` constructor.
 *
 * @api public
 */
function Server() {
  this._reqParsers = [];
  this._resHandlers = [];
  this._exchangers = [];
  
  this._validators = [];
  this._serializers = [];
  this._deserializers = [];
};



// TODO: Edit copy of this comment to reflect its purpose

/**
 * Register request parsing `fn` for optional `type`, defaulting to function's
 * name.
 *
 * OAuth 2.0 provides an authorization framework, in which the details and
 * format of the request/response can vary.  Request parsing functions are
 * responsible for parsing requests and returning an object.  If multiple
 * parsing functions match the type, they will be invoked in the order
 * registered and each return value will be merged into a single object. Set
 * `type` to `*` to parse requests of any type.
 *
 * Examples:
 *
 *     server.request(oauth2orize.request.code());
 *
 *     server.request('foo', function(req) {
 *       return { foo: req.query['foo'] }
 *     });
 *
 *     server.request('*', function(req) {
 *       return { host: req.headers['host'] }
 *     });
 *
 * @param {String|Strategy} name
 * @param {Strategy} strategy
 * @return {Passport} for chaining
 * @api public
 */

// TODO: make this function signature take the form of
//   approve('code', 'request', fn);   // type, phase, fn
//   approve('code', 'response', fn);
//
// TODO: make phase argument optional, default to request
//    approve('code', fn)
//
//   for mounting parse middleware

// TODO: Rename authz middleware to grant middleware

Server.prototype.grant = 
Server.prototype.approve = function(type, phase, fn) {
  if (typeof type == 'object') {
    // sig: approve(mod)
    var mod = type;
    if (mod.request) { this.approve(mod.name, 'request', mod.request); }
    if (mod.response) { this.approve(mod.name, 'response', mod.response); }
    return this;
  }
  if (typeof type == 'object') {
    // sig: approve(type, mod)
    var mod = phase;
    if (mod.request) { this.approve(type, 'request', mod.request); }
    if (mod.response) { this.approve(type, 'response', mod.response); }
    return this;
  }
  
  // TODO: add signature where fn can be mod, and phase says what method to pluck from it
  
  if (typeof phase == 'function') {
    // sig: approve(type, fn)
    fn = phase;
    phase = 'request';
  }
  if (type === '*') { type = null; }
  if (type) { type = new UnorderedList(type); }
  
  if (phase == 'request') {
    debug('register parser %s %s', type || '*', fn.name || 'anonymous');
    this._reqParsers.push({ type: type, handle: fn });
  } else if (phase == 'response') {
    debug('register responder %s %s', type || '*', fn.name || 'anonymous');
    this._resHandlers.push({ type: type, handle: fn });
  }
  return this;
}

Server.prototype.exchange = function(type, fn) {
  if (typeof type == 'function') {
    fn = type;
    type = fn.name;
  }
  if (type === '*') { type = null; }
  
  debug('register exchanger %s %s', type || '*', fn.name || 'anonymous');
  this._exchangers.push({ type: type, handle: fn });
  return this;
}

Server.prototype.authorize =
Server.prototype.authorization = function(options, validate) {
  return authorization(this, options, validate);
}

Server.prototype.decision = function(options) {
  // TODO: Probably want to pull out separate "transaction loading" middleware, and then
  // return both that and this as an array
  //
  //  decision({ loadTransaction: true});
  //    return [ loadTransaction(), decision() ];
  
  return [transactionLoader(this, options), decision(this, options)];
}

Server.prototype.token = function(options) {
  return token(this, options);
}

Server.prototype.errorHandler = function(options) {
  return errorHandler(this, options);
}

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
      return done(new Error('Failed to serialize client.  Register serialization function using `serializeClient()`.'));
    }
    
    try {
      layer(client, function(e, o) { pass(i + 1, e, o); } )
    } catch(e) {
      return done(e);
    }
  })(0);
}

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
    if (client === null || client === false) { return done(null, null); }
    
    var layer = stack[i];
    if (!layer) {
      return done(new Error('Failed to deserialize client.  Register deserialization function using `deserializeClient()`.'));
    }
    
    try {
      layer(obj, function(e, c) { pass(i + 1, e, c); } )
    } catch(e) {
      return done(e);
    }
  })(0);
}


// TODO: Rename this to _parse
Server.prototype._request = function(type, req, cb) {
  var ultype = new UnorderedList(type)
    , stack = this._reqParsers
    , areq = {};
  
  if (type) { areq.type = type; }
  
  // TODO: Implement support for parsing undefined types.
  //       example, pre-parsing for this:
  //       http://tools.ietf.org/id/draft-sakimura-oauth-requrl-02.txt
  
  (function pass(i) {
    var layer = stack[i];
    if (!layer) { return cb(null, areq); }
    
    try {
      // TODO: Check for types that aren't supported.
      
      debug('request:%s', layer.handle.name || 'anonymous');
      if (layer.type === null || layer.type.equalTo(ultype)) {
        var o = layer.handle(req);
        utils.merge(areq, o);
        pass(i + 1);
      } else {
        pass(i + 1);
      }
    } catch(e) {
      return cb(e);
    }
  })(0);
}

Server.prototype._response = function(txn, res, cb) {
  var ultype = new UnorderedList(txn.req.type)
    , stack = this._resHandlers
    , idx = 0;
  
  function next(err) {
    if (err) { return cb(err); }
    
    var layer = stack[idx++];
    if (!layer) { return cb(); }
    
    try {
      debug('response:%s', layer.handle.name || 'anonymous');
      if (layer.type === null || layer.type.equalTo(ultype)) {
        layer.handle(txn, res, next);
      } else {
        next();
      }
    } catch (e) {
      return cb(e);
    }
  }
  next();
}

Server.prototype._exchange = function(type, req, res, cb) {
  var stack = this._exchangers
    , idx = 0;
  
  function next(err) {
    if (err) { return cb(err); }
    
    var layer = stack[idx++];
    if (!layer) { return cb(); }
    
    // TODO: Errors for exhanging unsupported types.
    
    try {
      debug('exhange:%s', layer.handle.name || 'anonymous');
      if (layer.type === null || layer.type === type) {
        layer.handle(req, res, next);
      } else {
        next();
      }
    } catch (e) {
      return cb(e);
    }
  }
  next();
}


/**
 * Expose `Server`.
 */
exports = module.exports = Server;
