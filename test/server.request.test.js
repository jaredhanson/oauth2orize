var Server = require('../lib/server');
  

describe('Server', function() {
  
  describe('parsing authorization requests with one supported type', function() {
    var server = new Server();
    server.grant('foo', function(req) {
      return { foo: req.query.foo }
    });
    
    describe('request for supported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = { query: { foo: '1' } };
        
        server._parse('foo', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse request', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(2);
        expect(areq.type).to.equal('foo');
        expect(areq.foo).to.equal('1');
      });
    });
    
    describe('request for unsupported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = { query: { foo: '1' } };
        
        server._parse('bar', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse only type', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(1);
        expect(areq.type).to.equal('bar');
      });
    });
    
    describe('request for undefined type', function() {
      var areq, err;
    
      before(function(done) {
        var req = { query: { foo: '1' } };
        
        server._parse(undefined, req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should not parse request', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(0);
      });
    });
  });
  
  describe('parsing authorization requests with one wildcard parser', function() {
    var server = new Server();
    server.grant('*', function(req) {
      return { star: req.query.star }
    });
    
    describe('request for type', function() {
      var areq, err;
    
      before(function(done) {
        var req = { query: { star: 'orion' } };
        
        server._parse('foo', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse request', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(2);
        expect(areq.type).to.equal('foo');
        expect(areq.star).to.equal('orion');
      });
    });
  });
  
  describe('parsing authorization requests with a wildcard parser and one supported type', function() {
    var server = new Server();
    server.grant('*', function(req) {
      return { star: req.query.star }
    });
    server.grant('bar', function(req) {
      return { bar: req.query.bar }
    });
    
    describe('request for supported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = { query: { bar: '10', star: 'orion' } };
        
        server._parse('bar', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse request', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(3);
        expect(areq.type).to.equal('bar');
        expect(areq.star).to.equal('orion');
        expect(areq.bar).to.equal('10');
      });
    });
  });
  
  describe('parsing authorization requests with no supported types', function() {
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
    
      it('should parse only type', function() {
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
    
      it('should not parse request', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(0);
      });
    });
  });
  
  describe('parsing authorization requests with an async wildcard parser preceeding one supported type', function() {
    var server = new Server();
    server.grant('*', function(req, done) {
      return done(null, { star: req.query.star });
    });
    server.grant('bar', function(req) {
      return { bar: req.query.bar }
    })
    
    describe('request for supported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = { query: { bar: '10', star: 'orion' } };
        
        server._parse('bar', req, function(e, ar) {
          areq = ar;
          err = e;
          done();
        });
      });
    
      it('should not error', function() {
        expect(err).to.be.null;
      });
    
      it('should parse request', function() {
        expect(areq).to.be.an('object');
        expect(Object.keys(areq)).to.have.length(3);
        expect(areq.type).to.equal('bar');
        expect(areq.star).to.equal('orion');
        expect(areq.bar).to.equal('10');
      });
    });
  });
  
  describe('parsing requests with an async wildcard parser that encounters an error preceeding one supported type', function() {
    var server = new Server();
    server.grant('*', function(req, done) {
      return done(new Error('something went wrong'));
    });
    server.grant('bar', function(req) {
      return { bar: req.query.bar }
    })
    
    describe('request for supported type', function() {
      var areq, err;
    
      before(function(done) {
        var req = { query: { bar: '10', star: 'orion' } };
        
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
