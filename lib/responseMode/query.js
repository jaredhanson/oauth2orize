var url = require('url');

/**
* Authorization Response parameters are encoded in the query string added to the redirect_uri when 
* redirecting back to the Client.
**/
module.exports = function (res, redirectURI, params) {
  var parsed = url.parse(redirectURI, true);
  delete parsed.search;

  Object.keys(params || {}).forEach(function (k) {
    parsed.query[k] = params[k];
  });

  var location = url.format(parsed);
  return res.redirect(location);
};