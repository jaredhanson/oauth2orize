/**
 * Module dependencies.
 */
var fs = require('fs')
  , path = require('path')
  , Server = require('./server');


/**
 * Create an OAuth 2.0 server.
 *
 * @return {Server}
 * @api public
 */
function createServer(options) {
  var server = new Server(options);
  return server;
}

// expose createServer() as the module
exports = module.exports = createServer;

/**
 * Export `.createServer()`.
 */
exports.createServer = createServer;


/**
 * Export middleware.
 */
exports.errorHandler = require('./middleware/errorHandler');

/**
 * Auto-load bundled grants.
 */
exports.grant = {};
 
fs.readdirSync(__dirname + '/grant').forEach(function(filename) {
  if (/\.js$/.test(filename)) {
    var name = path.basename(filename, '.js');
    var load = function () { return require('./grant/' + name); };
    exports.grant.__defineGetter__(name, load);
  }
});

// alias grants
exports.grant.authorizationCode = exports.grant.code;
exports.grant.implicit = exports.grant.token;

/**
 * Auto-load bundled exchanges.
 */
exports.exchange = {};
 
fs.readdirSync(__dirname + '/exchange').forEach(function(filename) {
  if (/\.js$/.test(filename)) {
    var name = path.basename(filename, '.js');
    var load = function () { return require('./exchange/' + name); };
    exports.exchange.__defineGetter__(name, load);
  }
});

// alias exchanges
exports.exchange.code = exports.exchange.authorizationCode;

/**
 * Export errors.
 */
exports.OAuth2Error = require('./errors/oauth2error');
exports.AuthorizationError = require('./errors/authorizationerror');
exports.TokenError = require('./errors/tokenerror');
