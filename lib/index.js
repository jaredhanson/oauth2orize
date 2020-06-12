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
 * load grants.
 */
exports.grant = {};
exports.grant.code = require('./grant/code');
exports.grant.token =  require('./grant/token');


// alias grants
exports.grant.authorizationCode = exports.grant.code;
exports.grant.implicit = exports.grant.token;

/**
 * load exchanges.
 */
exports.exchange = {};
exports.exchange.authorizationCode = require('./exchange/authorizationCode');
exports.exchange.clientCredentials = require('./exchange/clientCredentials');
exports.exchange.password = require('./exchange/password');
exports.exchange.refreshToken = require('./exchange/refreshToken');


// alias exchanges
exports.exchange.code = exports.exchange.authorizationCode;

/**
 * Export errors.
 */
exports.OAuth2Error = require('./errors/oauth2error');
exports.AuthorizationError = require('./errors/authorizationerror');
exports.TokenError = require('./errors/tokenerror');
