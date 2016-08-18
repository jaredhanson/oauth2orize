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
  
  describe('with one exchange registered using a named function', function() {
    var server = new Server();
    server.exchange(code);
    function code(req, res, next) {
      if (req.code != '123') { return next(new Error('something is wrong')); }
      res.end('abc');
    }
    
    describe('handling a request with supported type', function() {
      var result, err;
    
      before(function(done) {
        var req = { code: '123' };
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
    
    describe('handling a request with unsupported type', function() {
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
    
    describe('handling a request with undefined type', function() {
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
  
  describe('with a wildcard exchange registered with null', function() {
    var server = new Server();
    server.exchange(null, function(req, res, next) {
      if (req.code != '123') { return next(new Error('something is wrong')); }
      res.end('abc')
    });
    
    describe('handling a request with type', function() {
      var result, err;
    
      before(function(done) {
        var req = { code: '123' };
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
        var req = { code: '123' };
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
  
  describe('with a wildcard exchange registered with star', function() {
    var server = new Server();
    server.exchange('*', function(req, res, next) {
      if (req.code != '123') { return next(new Error('something is wrong')); }
      res.end('abc')
    });
    
    describe('handling a request with type', function() {
      var result, err;
    
      before(function(done) {
        var req = { code: '123' };
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
        var req = { code: '123' };
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
  
  describe('with one wildcard exchange and one named exchange', function() {
    var server = new Server();
    server.exchange('*', function(req, res, next) {
      if (req.code != '123') { return next(new Error('something is wrong')); }
      req.star = true;
      next();
    });
    server.exchange('code', function(req, res, next) {
      if (!req.star) { return next(new Error('something is wrong')); }
      res.end('abc')
    });
    
    describe('handling a request with type', function() {
      var result, err;
    
      before(function(done) {
        var req = { code: '123' };
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
  });
  
  describe('with an exchange that encounters an error', function() {
    var server = new Server();
    server.exchange('code', function(req, res, next) {
      next(new Error('something went wrong'));
    });
    
    describe('handling a request with type', function() {
      var result, err;
    
      before(function(done) {
        var req = { code: '123' };
        var res = {};
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
      var result, err;
    
      before(function(done) {
        var req = {};
        var res = {};
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
