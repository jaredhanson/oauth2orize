var BadRequestError = require('../../lib/errors/badrequesterror');


describe('BadRequestError', function() {
    
  describe('constructed without a message', function() {
    var err = new BadRequestError();
    
    it('should have default properties', function() {
      expect(err.message).to.be.undefined;
    });
    
    it('should format correctly', function() {
      //expect(err.toString()).to.equal('BadRequestError');
      expect(err.toString().indexOf('BadRequestError')).to.equal(0);
    });
    
    it('should have status', function() {
      expect(err.status).to.equal(400);
    });
    
    it('should inherits from Error', function() {
      expect(err).to.be.instanceof(Error);
    });
  });
  
  describe('constructed with a message', function() {
    var err = new BadRequestError('Bad request');
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Bad request');
    });
    
    it('should format correctly', function() {
      expect(err.toString()).to.equal('BadRequestError: Bad request');
    });
    
    it('should have status', function() {
      expect(err.status).to.equal(400);
    });
  });
  
});
