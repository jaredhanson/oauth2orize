/**
 * `OAuth2Error` error.
 *
 * @api public
 */
function OAuth2Error(message) {
  Error.call(this);
}

/**
 * Inherit from `Error`.
 */
OAuth2Error.prototype.__proto__ = Error.prototype;


/**
 * Expose `OAuth2Error`.
 */
module.exports = OAuth2Error;
