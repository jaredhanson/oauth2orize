/**
 * Module dependencies.
 */
var Oauth2Error = require('./oauth2error');

/**
 * `ForbiddenError` error.
 *
 * @api public
 */
function ForbiddenError(message) {
  Oauth2Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'ForbiddenError';
  this.message = message;
  this.status = 403;
}

/**
 * Inherit from `Oauth2Error`.
 */
ForbiddenError.prototype.__proto__ = Oauth2Error.prototype;


/**
 * Expose `ForbiddenError`.
 */
module.exports = ForbiddenError;
