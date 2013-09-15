var Server = require('../lib/server');
  

describe('Server', function() {
  
  describe('registering a grant module', function() {
    var server = new Server();
    var mod = {};
    mod.name = 'foo';
    mod.request = function(req) {};
    mod.response = function(txn, res, next) {};
    server.grant(mod);
    
    it('should have one request parser', function() {
      expect(server._reqParsers).to.have.length(1);
      var parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('foo');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });
    
    it('should have one response handler', function() {
      expect(server._resHandlers).to.have.length(1);
      var handler = server._resHandlers[0];
      expect(handler.type.toString()).to.equal('foo');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });
  });
  
  describe('registering a grant module by type', function() {
    var server = new Server();
    var mod = {};
    mod.name = 'foo';
    mod.request = function(req) {};
    mod.response = function(txn, res, next) {};
    server.grant('bar', mod);
    
    it('should have one request parser', function() {
      expect(server._reqParsers).to.have.length(1);
      var parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('bar');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });
    
    it('should have one response handler', function() {
      expect(server._resHandlers).to.have.length(1);
      var handler = server._resHandlers[0];
      expect(handler.type.toString()).to.equal('bar');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });
  });
  
  describe('registering a grant parsing function by type', function() {
    var server = new Server();
    var mod = {};
    server.grant('foo', function(req) {});
    
    it('should have one request parser', function() {
      expect(server._reqParsers).to.have.length(1);
      var parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('foo');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });
    
    it('should not have any response handlers', function() {
      expect(server._resHandlers).to.have.length(0);
    });
  });
  
  describe('registering a grant parsing function by type and phase', function() {
    var server = new Server();
    var mod = {};
    server.grant('foo', 'request', function(req) {});
    
    it('should have one request parser', function() {
      expect(server._reqParsers).to.have.length(1);
      var parser = server._reqParsers[0];
      expect(parser.type.toString()).to.equal('foo');
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });
    
    it('should not have any response handlers', function() {
      expect(server._resHandlers).to.have.length(0);
    });
  });
  
  describe('registering a wildcard grant parsing function', function() {
    var server = new Server();
    var mod = {};
    server.grant('*', function(req) {});
    
    it('should have one request parser', function() {
      expect(server._reqParsers).to.have.length(1);
      var parser = server._reqParsers[0];
      expect(parser.type).to.be.null;
      expect(parser.handle).to.be.a('function');
      expect(parser.handle).to.have.length(1);
    });
    
    it('should not have any response handlers', function() {
      expect(server._resHandlers).to.have.length(0);
    });
  });
  
  describe('registering a grant responding function by type and phase', function() {
    var server = new Server();
    var mod = {};
    server.grant('foo', 'response', function(txn, res, next) {});
    
    it('should not have any request parsers', function() {
      expect(server._reqParsers).to.have.length(0);
    });
    
    it('should have one response handler', function() {
      expect(server._resHandlers).to.have.length(1);
      var handler = server._resHandlers[0];
      expect(handler.type.toString()).to.equal('foo');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });
  });
  
  describe('registering a wildcard grant responding function', function() {
    var server = new Server();
    var mod = {};
    server.grant('*', 'response', function(txn, res, next) {});
    
    it('should not have any request parsers', function() {
      expect(server._reqParsers).to.have.length(0);
    });
    
    it('should have one response handler', function() {
      expect(server._resHandlers).to.have.length(1);
      var handler = server._resHandlers[0];
      expect(handler.type).to.be.null;
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(3);
    });
  });
  
  
  describe('parsing requests for authorization with one registered parser', function() {
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
    
    describe('request', function() {
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
  
  describe('parsing requests for authorization with no registered parsers', function() {
    var server = new Server();
    
    describe('request with response_type', function() {
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
    
    describe('request without response_type', function() {
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
  
});
