/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize')
  , passport = require('passport')
  , login = require('connect-ensure-login')
  , db = require('./db')
  , utils = require('./utils');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  db.clients.find(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectURI` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.

server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var code = utils.uid(16)
  
  db.authorizationCodes.save(code, client.id, redirectURI, user.id, function(err) {
    if (err) { return done(err); }
    done(null, code);
  });
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectURI` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  db.authorizationCodes.find(code, function(err, authCode) {
    if (err) { return done(err); }
    if (client.id !== authCode.clientID) { return done(null, false); }
    if (redirectURI !== authCode.redirectURI) { return done(null, false); }
    
    var token = utils.uid(256)
    db.accessTokens.save(token, authCode.userID, authCode.clientID, function(err) {
      if (err) { return done(err); }
      done(null, token);
    });
  });
}));




exports.authorization = [
  login.ensureLoggedIn(),
  server.authorization(function(clientID, redirectURI, done) {
    db.clients.findByClientId(clientID, function(err, client) {
      if (err) { return done(err); }
      // WARNING: For security purposes, it is highly advisable to check that
      //          redirectURI provided by the client matches one registered with
      //          the server.  For simplicity, this example does not.  You have
      //          been warned.
      return done(null, client, redirectURI);
    });
  }),
  function(req, res){
    res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
  }
]

exports.decision = [
  login.ensureLoggedIn(),
  server.decision()
]

// TODO: Authenticate using HTTP Basic, in addition to client password
exports.token = [
  /*
  function(req, res, next) {
    console.log('!!!! TOKEN EXCHANGE !!!!');
    console.dir(req.headers)
    console.dir(req.body)
    next();
  },
  */
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler()
]

