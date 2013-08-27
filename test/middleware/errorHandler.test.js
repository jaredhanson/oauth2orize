var chai = require('chai')
  , errorHandler = require('../../lib/middleware/errorHandler');


describe('errorHandler', function() {
  
  it('should be named errorHandler', function() {
    expect(errorHandler().name).to.equal('errorHandler');
  });
  
  describe('direct mode', function() {
    var test = chai.connect(errorHandler());
    
    describe('handling an error', function() {
      var res;
  
      before(function(done) {
        test
          .req(function(req) {
          })
          .end(function(r) {
            res = r;
            done();
          })
          .dispatch(new Error('something went wrong'));
      });
  
      it('should set response headers', function() {
        expect(res.statusCode).to.equal(500);
        expect(res.getHeader('Content-Type')).to.equal('application/json');
        expect(res.getHeader('WWW-Authenticate')).to.be.undefined;
      });
      
      it('should set response body', function() {
        expect(res.body).to.equal('{"error":"server_error","error_description":"something went wrong"}');
      });
    });
    
  });
  
});

