var chai = require('chai')
  , connect = require('chai-connect-middleware');

chai.use(connect);

global.expect = chai.expect;
