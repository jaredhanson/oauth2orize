/**
 * Module dependencies.
 */
var url = require('url');

module.exports = function errorHandler(options) {
  options = options || {};
  
  var mode = options.mode || 'direct';
  
  // TODO: This should put responses in the fragment if needed
  
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
