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
    
    it('should not have any error handlers', function() {
      expect(server._errHandlers).to.have.length(0);
    });
  });
  
  describe('registering a grant module with error handler', function() {
    var server = new Server();
    var mod = {};
    mod.name = 'foo';
    mod.request = function(req) {};
    mod.response = function(txn, res, next) {};
    mod.error = function(err, txn, res, next) {};
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
    
    it('should have one error handler', function() {
      expect(server._errHandlers).to.have.length(1);
      var handler = server._errHandlers[0];
      expect(handler.type.toString()).to.equal('foo');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(4);
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
    
    it('should not have any error handlers', function() {
      expect(server._errHandlers).to.have.length(0);
    });
  });
  
  describe('registering a grant module with error handler by type', function() {
    var server = new Server();
    var mod = {};
    mod.name = 'foo';
    mod.request = function(req) {};
    mod.response = function(txn, res, next) {};
    mod.error = function(err, txn, res, next) {};
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
    
    it('should have one error handler', function() {
      expect(server._errHandlers).to.have.length(1);
      var handler = server._errHandlers[0];
      expect(handler.type.toString()).to.equal('bar');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(4);
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
    
    it('should not have any error handlers', function() {
      expect(server._errHandlers).to.have.length(0);
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
    
    it('should not have any error handlers', function() {
      expect(server._errHandlers).to.have.length(0);
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
    
    it('should not have any error handlers', function() {
      expect(server._errHandlers).to.have.length(0);
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
    
    it('should not have any error handlers', function() {
      expect(server._errHandlers).to.have.length(0);
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
    
    it('should not have any error handlers', function() {
      expect(server._errHandlers).to.have.length(0);
    });
  });
  
  describe('registering a grant error handling function by type and phase', function() {
    var server = new Server();
    var mod = {};
    server.grant('foo', 'error', function(err, txn, res, next) {});
    
    it('should not have any request parsers', function() {
      expect(server._reqParsers).to.have.length(0);
    });
    
    it('should not have any response handlers', function() {
      expect(server._resHandlers).to.have.length(0);
    });
    
    it('should have one error handler', function() {
      expect(server._errHandlers).to.have.length(1);
      var handler = server._errHandlers[0];
      expect(handler.type.toString()).to.equal('foo');
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(4);
    });
  });
  
  describe('registering a wildcard error handling function', function() {
    var server = new Server();
    var mod = {};
    server.grant('*', 'error', function(err, txn, res, next) {});
    
    it('should not have any request parsers', function() {
      expect(server._reqParsers).to.have.length(0);
    });
    
    it('should not have any response handlers', function() {
      expect(server._resHandlers).to.have.length(0);
    });
    
    it('should have one error handler', function() {
      expect(server._errHandlers).to.have.length(1);
      var handler = server._errHandlers[0];
      expect(handler.type).to.be.null;
      expect(handler.handle).to.be.a('function');
      expect(handler.handle).to.have.length(4);
    });
  });
  
});
