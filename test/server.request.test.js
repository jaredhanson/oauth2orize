var Server = require('../lib/server');
  

describe('Server', function() {
  
  describe('parsing requests for authorization with one supported type', function() {
    var server = new Server();
    server.grant('foo', function(req) {
      return { foo: '1' }
    });
    
    describe('request for supported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = {};
        
        server._parse('foo', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse an empty object', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(2);
        expect(areq.type).to.equal('foo');
        expect(areq.foo).to.equal('1');
      });
    });
    
    describe('request for unsupported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = {};
        
        server._parse('bar', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse an empty object', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(1);
        expect(areq.type).to.equal('bar');
      });
    });
    
    describe('request for undefined type', function() {
      var areq, err;
    
      before(function(done) {
        var req = {};
        
        server._parse(undefined, req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse an empty object', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(0);
      });
    });
  });
  
  describe('parsing requests for authorization with one wildcard parser', function() {
    var server = new Server();
    server.grant('*', function(req) {
      return { star: '1' }
    });
    
    describe('request for type', function() {
      var areq, err;
    
      before(function(done) {
        var req = {};
        
        server._parse('foo', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse an empty object', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(2);
        expect(areq.type).to.equal('foo');
        expect(areq.star).to.equal('1');
      });
    });
  });
  
  describe('parsing requests for authorization with one supported type and one wildcard parser', function() {
    var server = new Server();
    server.grant('*', function(req) {
      return { star: '1' }
    });
    server.grant('bar', function(req) {
      return { bar: '2' }
    });
    
    describe('request for supported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = {};
        
        server._parse('bar', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse an empty object', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(3);
        expect(areq.type).to.equal('bar');
        expect(areq.star).to.equal('1');
        expect(areq.bar).to.equal('2');
      });
    });
  });
  
  describe('parsing requests for authorization with no supported types', function() {
    var server = new Server();
    
    describe('request for type', function() {
      var areq, err;
    
      before(function(done) {
        var req = {};
        
        server._parse('foo', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse an empty object', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(1);
        expect(areq.type).to.equal('foo');
      });
    });
    
    describe('request for undefined type', function() {
      var areq, err;
    
      before(function(done) {
        var req = {};
        
        server._parse(undefined, req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse an empty object', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(0);
      });
    });
  });
  
  describe('parsing requests with an async parser preceeding a supported type', function() {
    var server = new Server();
    server.grant('*', function(req, done) {
      return done(null, { async: 'yay' });
    });
    server.grant('bar', function(req) {
      return { bar: '2' }
    })
    
    describe('request for supported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = {};
        
        server._parse('bar', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse an empty object', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(3);
        expect(areq.type).to.equal('bar');
        expect(areq.async).to.equal('yay');
        expect(areq.bar).to.equal('2');
      });
    });
  });
  
  describe('parsing requests with an async parser that encounters an error preceeding a supported type', function() {
    var server = new Server();
    server.grant('*', function(req, done) {
      return done(new Error('something went wrong'));
    });
    server.grant('bar', function(req) {
      return { bar: '2' }
    })
    
    describe('request for supported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = {};
        
        server._parse('bar', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should error', function() {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('something went wrong');
      });
    
      it('should not parse object', function() {
        expect(areq).to.be.undefined;
      });
    });
  });
  
});
