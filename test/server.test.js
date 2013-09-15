var Server = require('../lib/server');
  

describe('Server', function() {
  
  describe('newly initialized instance', function() {
    var server = new Server();
    
    it('should wrap authorization middleware', function() {
      expect(server.authorization).to.be.a('function');
      expect(server.authorization).to.have.length(2);
      expect(server.authorize).to.equal(server.authorization);
    });
    
    it('should wrap decision middleware', function() {
      expect(server.decision).to.be.a('function');
      expect(server.decision).to.have.length(2);
    });
    
    it('should wrap token middleware', function() {
      expect(server.token).to.be.a('function');
      expect(server.token).to.have.length(1);
    });
    
    it('should wrap errorHandler middleware', function() {
      expect(server.errorHandler).to.be.a('function');
      expect(server.errorHandler).to.have.length(1);
    });
    
    it('should have no request parsers', function() {
      expect(server._reqParsers).to.have.length(0);
    });
    
    it('should have no response handlers', function() {
      expect(server._resHandlers).to.have.length(0);
    });
    
    it('should have no exchanges', function() {
      expect(server._exchangers).to.have.length(0);
    });
    
    it('should have no serializers or deserializers', function() {
      expect(server._serializers).to.have.length(0);
      expect(server._deserializers).to.have.length(0);
    });
  });
  
});
