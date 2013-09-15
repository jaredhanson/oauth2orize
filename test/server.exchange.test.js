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
  
  describe('with an exchange with named function', function() {
    var server = new Server();
    
    function code(req, res, next) {
      res.end('abc');
    }
    server.exchange(code);
    
    describe('handling a request', function() {
      var result, err;
    
      before(function(done) {
        var req = {};
        var res = {};
        res.end = function(data) {
          result = data;
          done();
        }
        
        server._exchange('code', req, res, function(e) {
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
    
    describe('handling a request for unsupported type', function() {
      var result, err;
    
      before(function(done) {
        var req = {};
        var res = {};
        res.end = function(data) {
          done(new Error('should not be called'));
        }
        
        server._exchange('unsupported', req, res, function(e) {
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.undefined;
      });
    });
    
    describe('handling a request for undefined type', function() {
      var result, err;
    
      before(function(done) {
        var req = {};
        var res = {};
        res.end = function(data) {
          done(new Error('should not be called'));
        }
        
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
