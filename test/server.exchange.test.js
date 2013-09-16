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
  
  describe('with an exchange registered with null type processing parsed type', function() {
    var server = new Server();
    server.exchange(null, function(req, res, next) {
      res.end('abc')
    });
    
    describe('handling a request with type', function() {
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
    
    describe('handling a request without type', function() {
      var result, err;
    
      before(function(done) {
        var req = {};
        var res = {};
        res.end = function(data) {
          result = data;
          done();
        }
        
        server._exchange(undefined, req, res, function(e) {
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
  
  describe('with a wildcard exchange', function() {
    var server = new Server();
    server.exchange('*', function(req, res, next) {
      res.end('abc')
    });
    
    describe('handling a request with type', function() {
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
    
    describe('handling a request without type', function() {
      var result, err;
    
      before(function(done) {
        var req = {};
        var res = {};
        res.end = function(data) {
          result = data;
          done();
        }
        
        server._exchange(undefined, req, res, function(e) {
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
  
  describe('with a multiple exchanges', function() {
    var server = new Server();
    server.exchange('*', function(req, res, next) {
      req._starred = true;
      next();
    });
    server.exchange('code', function(req, res, next) {
      res.end('abc')
    });
    
    describe('handling a request with type', function() {
      var request, result, err;
    
      before(function(done) {
        var req = {};
        var res = {};
        
        request = req;
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
      
      it('should process through middleware', function() {
        expect(request._starred).to.be.true;
      });
      
      it('should send response', function() {
        expect(result).to.equal('abc');
      });
    });
  });
  
  describe('with an exchange that encounters an error', function() {
    var server = new Server();
    server.exchange('code', function(req, res, next) {
      next(new Error('something went wrong'));
    });
    
    describe('handling a request with type', function() {
      var request, result, err;
    
      before(function(done) {
        var req = {};
        var res = {};
        
        request = req;
        res.end = function(data) {
          done(new Error('should not be called'));
        }
        
        server._exchange('code', req, res, function(e) {
          err = e;
          return done();
        });
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong')
      });
    });
  });
  
  describe('with an exchange that throws an exception', function() {
    var server = new Server();
    server.exchange('code', function(req, res, next) {
      throw new Error('something was thrown');
    });
    
    describe('handling a request with type', function() {
      var request, result, err;
    
      before(function(done) {
        var req = {};
        var res = {};
        
        request = req;
        res.end = function(data) {
          done(new Error('should not be called'));
        }
        
        server._exchange('code', req, res, function(e) {
          err = e;
          return done();
        });
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something was thrown')
      });
    });
  });
  
});
