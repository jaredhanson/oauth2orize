/**
 * Module dependencies.
 */
var Oauth2Error = require('./oauth2error');

/**
 * `AuthorizationError` error.
 *
 * @api public
 */
function AuthorizationError(message, code, uri, status) {
  if (!status) {
    switch (code) {
      case 'invalid_request': status = 400; break;
      case 'unauthorized_client': status = 403; break;
      case 'access_denied': status = 403; break;
      case 'unsupported_response_type': status = 501; break;
      case 'invalid_scope': status = 400; break;
      case 'temporarily_unavailable': status = 503; break;
    }
  }
  
  Oauth2Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'AuthorizationError';
  this.message = message;
  this.code = code || 'server_error';
  this.uri = uri;
  this.status = status || 500;
}

/**
 * Inherit from `Oauth2Error`.
 */
AuthorizationError.prototype.__proto__ = Oauth2Error.prototype;


/**
 * Expose `AuthorizationError`.
 */
module.exports = AuthorizationError;
