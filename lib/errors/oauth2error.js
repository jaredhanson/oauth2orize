/**
 * `Oauth2Error` error.
 *
 * @api public
 */
function Oauth2Error(message) {
  Error.call(this);
}

/**
 * Inherit from `Error`.
 */
Oauth2Error.prototype.__proto__ = Error.prototype;


/**
 * Expose `Oauth2Error`.
 */
module.exports = Oauth2Error;
