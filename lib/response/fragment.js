var url = require('url')
  , qs = require('querystring');

/**
* Authorization Response parameters are encoded in the fragment added to the redirect_uri when 
* redirecting back to the Client.
**/
module.exports = function (txn, res, params) {
  var parsed = url.parse(txn.redirectURI);
  parsed.hash = qs.stringify(params || {});

  var location = url.format(parsed);
  return res.redirect(location);
};
