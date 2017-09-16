# OAuth2orize

[![Build](https://img.shields.io/travis/jaredhanson/oauth2orize.svg)](https://travis-ci.org/jaredhanson/oauth2orize)
[![Coverage](https://img.shields.io/coveralls/jaredhanson/oauth2orize.svg)](https://coveralls.io/r/jaredhanson/oauth2orize)
[![Quality](https://img.shields.io/codeclimate/github/jaredhanson/oauth2orize.svg?label=quality)](https://codeclimate.com/github/jaredhanson/oauth2orize)
[![Dependencies](https://img.shields.io/david/jaredhanson/oauth2orize.svg)](https://david-dm.org/jaredhanson/oauth2orize)

OAuth2orize is an authorization server toolkit for Node.js.  It provides a suite
of middleware that, combined with [Passport](http://passportjs.org/)
authentication strategies and application-specific route handlers, can be used
to assemble a server that implements the [OAuth 2.0](http://tools.ietf.org/html/rfc6749)
protocol.

## Install

    $ npm install oauth2orize

## Usage

OAuth 2.0 defines an authorization framework, allowing an extensible set of
authorization grants to be exchanged for access tokens.  Implementations are
free to choose what grant types to support, by using bundled middleware to
support common types or plugins to support extension types.

#### Create an OAuth Server

Call `createServer()` to create a new OAuth 2.0 server.  This instance exposes
middleware that will be mounted in routes, as well as configuration options.

```javascript
var server = oauth2orize.createServer();
```

#### Register Grants

A client must obtain permission from a user before it is issued an access token.
This permission is known as a grant, the most common type of which is an
authorization code.
```javascript
server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
  var code = utils.uid(16);

  var ac = new AuthorizationCode(code, client.id, redirectURI, user.id, ares.scope);
  ac.save(function(err) {
    if (err) { return done(err); }
    return done(null, code);
  });
}));
```

OAuth2orize also bundles support for implicit token grants.

#### Register Exchanges

After a client has obtained an authorization grant from the user, that grant can
be exchanged for an access token.

```javascript
server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
  AuthorizationCode.findOne(code, function(err, code) {
    if (err) { return done(err); }
    if (client.id !== code.clientId) { return done(null, false); }
    if (redirectURI !== code.redirectUri) { return done(null, false); }

    var token = utils.uid(256);
    var at = new AccessToken(token, code.userId, code.clientId, code.scope);
    at.save(function(err) {
      if (err) { return done(err); }
      return done(null, token);
    });
  });
}));
```

OAuth2orize also bundles support for password and client credential grants.
Additionally, bundled refresh token support allows expired access tokens to be
renewed.

#### Implement Authorization Endpoint

When a client requests authorization, it will redirect the user to an
authorization endpoint.  The server must authenticate the user and obtain
their permission.

```javascript
app.get('/dialog/authorize',
  login.ensureLoggedIn(),
  server.authorize(function(clientID, redirectURI, done) {
    Clients.findOne(clientID, function(err, client) {
      if (err) { return done(err); }
      if (!client) { return done(null, false); }
      if (client.redirectUri != redirectURI) { return done(null, false); }
      return done(null, client, client.redirectURI);
    });
  }),
  function(req, res) {
    res.render('dialog', { transactionID: req.oauth2.transactionID,
                           user: req.user, client: req.oauth2.client });
  });
```

In this example, [connect-ensure-login](https://github.com/jaredhanson/connect-ensure-login)
middleware is being used to make sure a user is authenticated before
authorization proceeds.  At that point, the application renders a dialog
asking the user to grant access.  The resulting form submission is processed
using `decision` middleware.

```javascript
app.post('/dialog/authorize/decision',
   login.ensureLoggedIn(),
   server.decision());
```
       
Based on the grant type requested by the client, the appropriate grant
module registered above will be invoked to issue an authorization code.

#### Session Serialization

Obtaining the user's authorization involves multiple request/response pairs.
During this time, an OAuth 2.0 transaction will be serialized to the session.
Client serialization functions are registered to customize this process, which
will typically be as simple as serializing the client ID, and finding the client
by ID when deserializing.

```javascript
server.serializeClient(function(client, done) {
  return done(null, client.id);
});

server.deserializeClient(function(id, done) {
  Clients.findOne(id, function(err, client) {
    if (err) { return done(err); }
    return done(null, client);
  });
});
```

#### Implement Token Endpoint

Once a user has approved access, the authorization grant can be exchanged by the
client for an access token.

```javascript
app.post('/token',
  passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
  server.token(),
  server.errorHandler());
```

[Passport](http://passportjs.org/) strategies are used to authenticate the
client, in this case using either an HTTP Basic authentication header (as
provided by [passport-http](https://github.com/jaredhanson/passport-http)) or
client credentials in the request body (as provided by 
[passport-oauth2-client-password](https://github.com/jaredhanson/passport-oauth2-client-password)).

Based on the grant type issued to the client, the appropriate exchange module
registered above will be invoked to issue an access token.  If an error occurs,
`errorHandler` middleware will format an error response.

#### Implement API Endpoints

Once an access token has been issued, a client will use it to make API requests
on behalf of the user.
```javascript
app.get('/api/userinfo', 
  passport.authenticate('bearer', { session: false }),
  function(req, res) {
    res.json(req.user);
  });
```

In this example, bearer tokens are issued, which are then authenticated using
an HTTP Bearer authentication header (as provided by [passport-http-bearer](https://github.com/jaredhanson/passport-http-bearer))

## Examples

This [example](https://github.com/gerges-beshay/oauth2orize-examples) demonstrates
how to implement an OAuth service provider, complete with protected API access.

## Related Modules

- [oauth2orize-openid](https://github.com/jaredhanson/oauth2orize-openid) — Extensions to support OpenID Connect
- [oauth2orize-jwt-bearer](https://github.com/xtuple/oauth2orize-jwt-bearer) — Exchange JWT assertions for access tokens
- [passport-http-bearer](https://github.com/jaredhanson/passport-http-bearer) — Bearer token authentication strategy for APIs

## Debugging

oauth2orize uses the [debug module](https://www.npmjs.org/package/debug).  You can enable debugging messages on the console by doing ```export DEBUG=oauth2orize``` before running your application.

## Contributing

#### Tests

The test suite is located in the `test/` directory.  All new features are
expected to have corresponding test cases.  Ensure that the complete test suite
passes by executing:

```bash
$ make test
```

#### Coverage

All new feature development is expected to have test coverage.  Patches that
increse test coverage are happily accepted.  Coverage reports can be viewed by
executing:

```bash
$ make test-cov
$ make view-cov
```

## Support

#### Funding

This software is provided to you as open source, free of charge.  The time and
effort to develop and maintain this project is dedicated by [@jaredhanson](https://github.com/jaredhanson).
If you (or your employer) benefit from this project, please consider a financial
contribution.  Your contribution helps continue the efforts that produce this
and other open source software.

Funds are accepted via [PayPal](https://paypal.me/jaredhanson), [Venmo](https://venmo.com/jaredhanson),
and [other](http://jaredhanson.net/pay) methods.  Any amount is appreciated.

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2012-2017 Jared Hanson <[http://jaredhanson.net/](http://jaredhanson.net/)>

<a target='_blank' rel='nofollow' href='https://app.codesponsor.io/link/vK9dyjRnnWsMzzJTQ57fRJpH/jaredhanson/oauth2orize'>  <img alt='Sponsor' width='888' height='68' src='https://app.codesponsor.io/embed/vK9dyjRnnWsMzzJTQ57fRJpH/jaredhanson/oauth2orize.svg' /></a>
