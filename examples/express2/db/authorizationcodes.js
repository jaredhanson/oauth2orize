var codes = {};


exports.find = function(key, done) {
  var code = codes[key];
  return done(null, code);
};

exports.save = function(code, clientID, redirectURI, userID, done) {
  codes[code] = { clientID: clientID, redirectURI: redirectURI, userID: userID };
  return done(null);
};
