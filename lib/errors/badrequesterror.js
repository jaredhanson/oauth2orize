/**
 * Module dependencies.
 */
var Oauth2Error = require('./oauth2error');

/**
 * `BadRequestError` error.
 *
 * @api public
 */
function BadRequestError(message) {
  Oauth2Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'BadRequestError';
  this.message = message;
  this.status = 400;
}

/**
 * Inherit from `Oauth2Error`.
 */
BadRequestError.prototype.__proto__ = Oauth2Error.prototype;


/**
 * Expose `BadRequestError`.
 */
module.exports = BadRequestError;
