var Oauth2Error = require('../../lib/errors/oauth2error')
  , AuthorizationError = require('../../lib/errors/authorizationerror')
  , BadRequestError = require('../../lib/errors/badrequesterror')
  , ForbiddenError = require('../../lib/errors/forbiddenerror')
  , TokenError = require('../../lib/errors/tokenerror');


describe('Oauth2Error', function() {
  describe('AuthorizationError', function () {
    var err = new AuthorizationError();
    it('should inherits from Oauth2Error and Error', function() {
      expect(err).to.be.instanceof(Oauth2Error);
      expect(err).to.be.instanceof(Error);
    });
  });

  describe('BadRequestError', function () {
    var err = new BadRequestError();
    it('should inherits from Oauth2Error and Error', function() {
      expect(err).to.be.instanceof(Oauth2Error);
      expect(err).to.be.instanceof(Error);
    });
  });

  describe('ForbiddenError', function () {
    var err = new ForbiddenError();
    it('should inherits from Oauth2Error and Error', function() {
      expect(err).to.be.instanceof(Oauth2Error);
      expect(err).to.be.instanceof(Error);
    });
  });

  describe('TokenError', function () {
    var err = new TokenError();
    it('should inherits from Oauth2Error and Error', function() {
      expect(err).to.be.instanceof(Oauth2Error);
      expect(err).to.be.instanceof(Error);
    });
  });

});
