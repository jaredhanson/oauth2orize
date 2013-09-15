var Server = require('../lib/server');
  

describe('Server', function() {
  
  describe('handling response to authorization with one supported type', function() {
    var server = new Server();
    server.grant('code', 'response', function(txn, res, next) {
      res.end('abc');
    });
    
    describe('response to supported type', function() {
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
    
    describe('response to unsupported type', function() {
      var result, err;
    
      before(function(done) {
        var txn = { req: { type: 'unsupported' } };
        var res = {};
        res.end = function(data) {
          done(new Error('should not be called'));
        }
        
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
  
  describe('handling response to authorization with one wildcard responder', function() {
    var server = new Server();
    server.grant('*', 'response', function(txn, res, next) {
      res.end('abc');
    });
    
    describe('response to a type', function() {
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
  
  describe('handling response to authorization with one wildcard responder and one supported type', function() {
    var server = new Server();
    server.grant('*', 'response', function(txn, res, next) {
      res.star = true;
      next();
    });
    server.grant('code', 'response', function(txn, res, next) {
      res.end('abc');
    });
    
    describe('response to a type', function() {
      var response, result, err;
    
      before(function(done) {
        var txn = { req: { type: 'code' } };
        var res = {};
        res.end = function(data) {
          result = data;
          done();
        }
        
        response = res;
        server._respond(txn, res, function(e) {
          done(new Error('should not be called'));
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.undefined;
      });
      
      it('should extend response', function() {
        expect(response.star).to.be.true;
      });
      
      it('should send response', function() {
        expect(result).to.equal('abc');
      });
    });
  });
  
  describe('handling response to authorization with responder that encounters an error', function() {
    var server = new Server();
    server.grant('code', 'response', function(txn, res, next) {
      next(new Error('something went wrong'))
    });
    
    describe('response to a type', function() {
      var result, err;
    
      before(function(done) {
        var txn = { req: { type: 'code' } };
        var res = {};
        res.end = function(data) {
          done(new Error('should not be called'));
        }
        
        server._respond(txn, res, function(e) {
          err = e;
          done();
        });
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });
  
  describe('handling response to authorization with responder that throws an error', function() {
    var server = new Server();
    server.grant('code', 'response', function(txn, res, next) {
      throw new Error('something was thrown');
    });
    
    describe('response to a type', function() {
      var result, err;
    
      before(function(done) {
        var txn = { req: { type: 'code' } };
        var res = {};
        res.end = function(data) {
          done(new Error('should not be called'));
        }
        
        server._respond(txn, res, function(e) {
          err = e;
          done();
        });
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something was thrown');
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
