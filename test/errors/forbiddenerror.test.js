var ForbiddenError = require('../../lib/errors/forbiddenerror');


describe('ForbiddenError', function() {
    
  describe('constructed without a message', function() {
    var err = new ForbiddenError();
    
    it('should have default properties', function() {
      expect(err.message).to.be.undefined;
    });
    
    it('should format correctly', function() {
      //expect(err.toString()).to.equal('ForbiddenError');
      expect(err.toString().indexOf('ForbiddenError')).to.equal(0);
    });
    
    it('should have status', function() {
      expect(err.status).to.equal(403);
    });
    
    it('should inherits from Error', function() {
      expect(err).to.be.instanceof(Error);
    });
  });
  
  describe('constructed with a message', function() {
    var err = new ForbiddenError('Forbidden');
    
    it('should have default properties', function() {
      expect(err.message).to.equal('Forbidden');
    });
    
    it('should format correctly', function() {
      expect(err.toString()).to.equal('ForbiddenError: Forbidden');
    });
    
    it('should have status', function() {
      expect(err.status).to.equal(403);
    });
  });
  
});
