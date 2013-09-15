var Server = require('../lib/server');
  

describe('Server', function() {
  
  describe('with no exchanges', function() {
    var server = new Server();
    
    describe('handling a request', function() {
      var err;
    
      before(function(done) {
        var req = {};
        var res = {};
        
        server._exchange(undefined, req, res, function(e) {
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
