# OAuth2orize

OAuth2orize is an authorization server toolkit for Node.js.  It provides a suite
of middleware that, combined with [Passport](http://passportjs.org/)
authentication middleware and application-specific route handlers, can be used
to assemble a server that implements the [OAuth 2.0](http://tools.ietf.org/html/draft-ietf-oauth-v2-28)
protocol.

## Installation

    $ npm install oauth2orize

## Usage

OAuth 2.0 defines an authorization framework, allowing an extensible set of
authorization grants to be exchanged for access tokens.  Implementations are
free to choose what types to support, by using bundled middleware to support
common types or plugins to support extension types.

#### Create an OAuth Server

Call `createServer()` to create a new OAuth 2.0 server.  This instance exposes
middleware that will be mounted in routes, as well as configuration options.

    var server = oauth2orize.createServer();

#### Register Grant Middleware

A client must obtain permission from a user before it is issued an access token.
This permission is known as a grant, the most common type of which is an
authorization code.

    server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
      var code = utils.uid(16);

      var ac = new AuthorizationCode(code, client.id, redirectURI, user.id, ares.scope);
      ac.save(function(err) {
        if (err) { return done(err); }
        return done(null, code);
      });
    }));

OAuth2orize also bundles support for implicit token grants.

#### Register Exchange Middleware

After a client has obtained an authorization grant from the user, that grant can
be exchanged for an access token.

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

OAuth2orize also bundles support for password and client credential grants.
Additionally, bundled refresh token support allows expired access tokens to be
renewed.

#### Implement Authorization Endpoint

When a client requests authorization, it will redirect the user to an
authorization endpoint.  The server must authenticate the user and obtain
their permission.

    app.get('/dialog/authorize',
      login.ensureLoggedIn(),
      server.authorize(function(clientID, redirectURI, done) {
        Clients.findOne(clientID, function(err, client) {
          if (err) { return done(err); }
          if (!client) { return done(null, false); }
          if (!client.redirectUri != redirectURI) { return done(null, false); }
          return done(null, client, client.redirectURI);
        });
      }),
      function(req, res) {
        res.render('dialog', { transactionID: req.oauth2.transactionID,
                               user: req.user, client: req.oauth2.client });
      });

In this example, [connect-ensure-login](https://github.com/jaredhanson/connect-ensure-login)
middleware is being used to make sure a user is authenticated before
authorization proceeds.  At that point, the application renders a dialog
asking the user to grant access.  The resulting form submission is processed
using `decision` middleware.

     app.post('/dialog/authorize/decision',
       login.ensureLoggedIn(),
       server.decision());
       
Based on the grant type requested by the client, the appropriate grant
middleware registered above will be invoked to issue an authorization code.

#### Session Serialization

Obtaining the user's authorization involves multiple request/response pairs.
During this time, an OAuth 2.0 transaction will be serialized to the session.
Client serialization functions are registered to customize this process, which
will typically be as simple as serializing the client ID, and finding the client
by ID when deserializing.

    server.serializeClient(function(client, done) {
      return done(null, client.id);
    });

    server.deserializeClient(function(id, done) {
      Clients.findOne(id, function(err, client) {
        if (err) { return done(err); }
        return done(null, client);
      });
    });

#### Implement Token Endpoint

Once a user has approved access, the authorization grant can be exchanged by the
client for an access token.

    app.post('/token',
      passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
      server.token(),
      server.errorHandler());

[Passport](http://passportjs.org/) strategies are used to authenticate the
client, in this case using either an HTTP Basic authentication header (as
provided by [passport-http](https://github.com/jaredhanson/passport-http)) or
client credentials in the request body (as provided by 
[passport-oauth2-client-password](https://github.com/jaredhanson/passport-oauth2-client-password)).

Based on the grant type issue to the client, the appropriate exchange middleware
registered above will be invoked to issue an access token.  If an error occurs,
`errorHandler` middleware will format an error response.

#### Implement API Endpoints

Once an access token has been issued, a client will use it to make API requests
on behalf of the user.

    app.get('/api/userinfo', 
      passport.authenticate('bearer', { session: false }),
      function(req, res) {
        res.json(req.user);
      });

In this example, bearer tokens are issued, which are then authenticated using
an HTTP Bearer authentication header (as provided by [passport-http-bearer](https://github.com/jaredhanson/passport-http-bearer))

## Examples

This [example](https://github.com/jaredhanson/oauth2orize/tree/master/examples/express2) demonstrates
how to implement an OAuth service provider, complete with protected API access.

## Tests

    $ npm install --dev
    $ make test

[![Build Status](https://secure.travis-ci.org/jaredhanson/oauth2orize.png)](http://travis-ci.org/jaredhanson/oauth2orize)

## Credits

  - [Jared Hanson](http://github.com/jaredhanson)

## License

(The MIT License)

Copyright (c) 2012 Jared Hanson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
