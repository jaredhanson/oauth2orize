var chai = require('chai')
  , connect = require('chai-connect-middleware')
  , grant = require('chai-oauth2orize-grant');

chai.use(connect);
chai.use(grant);

global.expect = chai.expect;
