/**
 * Module dependencies.
 */
var fs = require('fs')
  , path = require('path')
  , Server = require('./server');


// expose createServer() as the module
exports = module.exports = createServer;

/**
 * Create an OAuth 2.0 server.
 *
 * @return {Server}
 * @api public
 */
function createServer() {
  var server = new Server();
  return server;
}

/**
 * Expose `.createServer()` as module method.
 */
exports.createServer = createServer;


/**
 * Auto-load bundled grant middleware.
 */
exports.grant = {};
 
fs.readdirSync(__dirname + '/grant').forEach(function(filename) {
  if (/\.js$/.test(filename)) {
    var name = path.basename(filename, '.js');
    function load() { return require('./grant/' + name); }
    exports.grant.__defineGetter__(name, load);
  }
});

exports.grant.authorizationCode = exports.grant.code;
exports.grant.implicit = exports.grant.token;

/**
 * Auto-load bundled exchange middleware.
 */
exports.exchange = {};
 
fs.readdirSync(__dirname + '/exchange').forEach(function(filename) {
  if (/\.js$/.test(filename)) {
    var name = path.basename(filename, '.js');
    function load() { return require('./exchange/' + name); }
    exports.exchange.__defineGetter__(name, load);
  }
});

exports.exchange.code = exports.exchange.authorizationCode;
