var Server = require('../lib/server');
  

describe('Server', function() {
  
  describe('handling response to authorization with one supported type', function() {
    var server = new Server();
    server.grant('code', 'response', function(txn, res, next) {
      res.end('abc');
    });
    
    describe('response', function() {
      var result, err;
    
      before(function(done) {
        var txn = { req: { type: 'code' } };
        var res = {};
        res.end = function(data) {
          result = data;
          done();
        }
        
        server._respond(txn, res, function(e) {
          done(new Error('should not be called'));
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.undefined;
      });
      
      it('should send response', function() {
        expect(result).to.equal('abc');
      });
    });
  });
  
  describe('handling response to authorization with no supported types', function() {
    var server = new Server();
    
    describe('response', function() {
      var err;
    
      before(function(done) {
        var txn = { req: { type: 'code' } };
        var res = {};
        
        server._respond(txn, res, function(e) {
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.undefined;
      });
    });
  });
  
});
