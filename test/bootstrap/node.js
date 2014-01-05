var chai = require('chai');

chai.use(require('chai-connect-middleware'));
chai.use(require('chai-oauth2orize-grant'));

global.expect = chai.expect;
