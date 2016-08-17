var Server = require('../lib/server');
  

describe('Server', function() {
  
  describe('handling authorization error with one supported type', function() {
    var server = new Server();
    server.grant('foo', 'error', function(err, txn, res, next) {
      if (txn.req.scope != 'read') { return next(new Error('something is wrong')); }
      res.end('error: ' + err.message);
    });
    
    describe('response to supported type', function() {
      var result, err;
    
      before(function(done) {
        var txn = { req: { type: 'foo', scope: 'read' } };
        var res = {};
        res.end = function(data) {
          result = data;
          done();
        }
        
        server._respondError(new Error('something went wrong'), txn, res, function(e) {
          done(new Error('should not be called'));
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.undefined;
      });
      
      it('should send response', function() {
        expect(result).to.equal('error: something went wrong');
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
        
        server._respondError(new Error('something went wrong'), txn, res, function(e) {
          err = e;
          done();
        });
      });
    
      it('should preserve error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });
  
  describe('handling authorization error with responder that throws an exception', function() {
    var server = new Server();
    server.grant('foo', 'error', function(err, txn, res, next) {
      throw new Error('something else went horribly wrong');
    });
    
    
    describe('response to supported type', function() {
      var result, err;
    
      before(function(done) {
        var txn = { req: { type: 'foo' } };
        var res = {};
        res.end = function(data) {
          done(new Error('should not be called'));
        }
        
        server._respondError(new Error('something went wrong'), txn, res, function(e) {
          err = e;
          done();
        });
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something else went horribly wrong');
      });
    });
  });
  
  describe('handling authorization error with no supported types', function() {
    var server = new Server();
    
    
    describe('response to unsupported type', function() {
      var result, err;
    
      before(function(done) {
        var txn = { req: { type: 'foo' } };
        var res = {};
        res.end = function(data) {
          done(new Error('should not be called'));
        }
        
        server._respondError(new Error('something went wrong'), txn, res, function(e) {
          err = e;
          done();
        });
      });
    
      it('should preserve error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    });
  });
  
});
