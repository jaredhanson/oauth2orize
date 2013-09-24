/**
 * `ForbiddenError` error.
 *
 * @api public
 */
function ForbiddenError(message) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'ForbiddenError';
  this.message = message;
  this.status = 403;
}

/**
 * Inherit from `Error`.
 */
ForbiddenError.prototype.__proto__ = Error.prototype;


/**
 * Expose `ForbiddenError`.
 */
module.exports = ForbiddenError;
