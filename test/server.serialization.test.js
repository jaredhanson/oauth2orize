var Server = require('../lib/server');
  

describe('Server', function() {
  
  describe('#serializeClient', function() {
    
    describe('no serializers', function() {
      var server = new Server();
      
      describe('serializing', function() {
        var obj, err;
    
        before(function(done) {
          server.serializeClient({ id: '1', name: 'Foo' }, function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should error', function() {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('Failed to serialize client.  Register serialization function using serializeClient().')
        });
      });
    });
    
    describe('one serializers', function() {
      var server = new Server();
      server.serializeClient(function(client, done) {
        done(null, client.id);
      });
      
      describe('serializing', function() {
        var obj, err;
    
        before(function(done) {
          server.serializeClient({ id: '1', name: 'Foo' }, function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should not error', function() {
          expect(err).to.be.null;
        });
        
        it('should serialize', function() {
          expect(obj).to.equal('1');
        });
      });
    });
    
    describe('multiple serializers', function() {
      var server = new Server();
      server.serializeClient(function(client, done) {
        done('pass');
      });
      server.serializeClient(function(client, done) {
        done(null, 'second-serializer');
      });
      server.serializeClient(function(client, done) {
        done(null, 'should-not-execute');
      });
      
      describe('serializing', function() {
        var obj, err;
    
        before(function(done) {
          server.serializeClient({ id: '1', name: 'Foo' }, function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should not error', function() {
          expect(err).to.be.null;
        });
        
        it('should serialize', function() {
          expect(obj).to.equal('second-serializer');
        });
      });
    });
    
    describe('serializer that throws an error', function() {
      var server = new Server();
      server.serializeClient(function(client, done) {
        throw new Error('something was thrown')
      });
      
      describe('serializing', function() {
        var obj, err;
    
        before(function(done) {
          server.serializeClient({ id: '1', name: 'Foo' }, function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should error', function() {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('something was thrown');
        });
      });
    });
    
  }); // #serializeClient
  
});
