/**
 * Module dependencies.
 */
var url = require('url');


/**
 * Handles errors encountered in OAuth 2.0 endpoints.
 *
 * This is error handling middleware intended for use in endpoints involved in
 * the OAuth 2.0 protocol.  If an error occurs while processing a request, this
 * middleware formats a response in accordance with the OAuth 2.0 specification.
 *
 * This middleware has two modes of operation: direct and indirect.  Direct mode
 * (the default) is intended to be used with the token endpoint, in which the
 * response can be sent directly to the client.  Indirect mode is intended to be
 * used with user authorization endpoints, in which the response must be issued
 * to the client indirectly via a redirect through the user's browser.
 *
 * Options:
 *   - `mode`   mode of operation, defaults to `direct`
 *
 * Examples:
 *
 *     app.post('/token',
 *       passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
 *       server.token(),
 *       server.errorHandler());
 *
 *    app.get('/dialog/authorize',
 *       login.ensureLoggedIn(),
 *       server.authorization( ... )
 *       server.errorHandler({ mode: 'indirect' }));
 *
 * References:
 *  - [Error Response](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-5.2)
 *  - [Authorization Response](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-4.1.2)
 *  - [Authorization Response](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-4.2.2)
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */
module.exports = function errorHandler(options) {
  options = options || {};
  
  var mode = options.mode || 'direct';
  
  // TODO: Error response should be added in the URL fragment, if the client is
  //       requesting an implicit token.
  
  return function errorHandler(err, req, res, next) {
    if (mode == 'direct') {
      if (err.status) { res.statusCode = err.status; }
      if (!res.statusCode || res.statusCode < 400) { res.statusCode = 500; }
      
      if (res.statusCode == 401) {
        // TODO: set WWW-Authenticate header
      }
      
      var e = {};
      e['error'] = err.code || 'server_error';
      if (err.message) { e['error_description'] = err.message; }
      if (err.uri) { e['error_uri'] = err.uri; }
      
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify(e));
    } else if (mode == 'indirect') {
      // If the redirectURI for this OAuth 2.0 transaction is invalid, the user
      // agent will not be redirected and the client will not be informed.  `next`
      // immediately into the application's error handler, so a message can be
      // displayed to the user.
      if (!req.oauth2 || !req.oauth2.redirectURI) { return next(err); }

      var redirectURI = req.oauth2.redirectURI;
      var parsed = url.parse(redirectURI, true);
      delete parsed.search;
      parsed.query['error'] = err.code || 'server_error';
      if (err.message) { parsed.query['error_description'] = err.message; }
      if (err.uri) { parsed.query['error_uri'] = err.uri; }
      if (req.oauth2.req && req.oauth2.req.state) { parsed.query['state'] = req.oauth2.req.state; }

      var location = url.format(parsed);
      res.redirect(location);
    } else {
      return next(err);
    }
  }
}
