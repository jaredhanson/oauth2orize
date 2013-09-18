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
          expect(err.message).to.equal('Failed to serialize client. Register serialization function using serializeClient().')
        });
      });
    });
    
    describe('one serializer', function() {
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
        done(null, '#2');
      });
      server.serializeClient(function(client, done) {
        done(null, '#3');
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
          expect(obj).to.equal('#2');
        });
      });
    });
    
    describe('serializer that encounters an error', function() {
      var server = new Server();
      server.serializeClient(function(client, done) {
        return done(new Error('something went wrong'));
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
          expect(err.message).to.equal('something went wrong');
        });
      });
    });
    
    describe('serializer that throws an exception', function() {
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
  
  describe('#deserializeClient', function() {
  
    describe('no deserializers', function() {
      var server = new Server();
      
      describe('deserializing', function() {
        var obj, err;
    
        before(function(done) {
          server.deserializeClient('1', function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should error', function() {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('Failed to deserialize client. Register deserialization function using deserializeClient().')
        });
      });
    });
    
    describe('one deserializer', function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        done(null, { id: id });
      });
      
      describe('deserializing', function() {
        var obj, err;
    
        before(function(done) {
          server.deserializeClient('1', function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should not error', function() {
          expect(err).to.be.null;
        });
        
        it('should deserialize', function() {
          expect(obj.id).to.equal('1');
        });
      });
    });
    
    describe('multiple deserializers', function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        done('pass');
      });
      server.deserializeClient(function(id, done) {
        done(null, { id: '#2' });
      });
      server.deserializeClient(function(id, done) {
        done(null, { id: '#3' });
      });
      
      describe('deserializing', function() {
        var obj, err;
    
        before(function(done) {
          server.deserializeClient('1', function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should not error', function() {
          expect(err).to.be.null;
        });
        
        it('should deserialize', function() {
          expect(obj.id).to.equal('#2');
        });
      });
    });
    
    describe('one deserializer to null', function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        done(null, null);
      });
      
      describe('deserializing', function() {
        var obj, err;
    
        before(function(done) {
          server.deserializeClient('1', function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should not error', function() {
          expect(err).to.be.null;
        });
        
        it('should invalidate client', function() {
          expect(obj).to.be.false;
        });
      });
    });
    
    describe('one deserializer to false', function() {
      var server = new Server();
      server.deserializeClient(function(id, done) {
        done(null, false);
      });
      
      describe('deserializing', function() {
        var obj, err;
    
        before(function(done) {
          server.deserializeClient('1', function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should not error', function() {
          expect(err).to.be.null;
        });
        
        it('should invalidate client', function() {
          expect(obj).to.be.false;
        });
      });
    });
    
    describe('multiple deserializers to null', function() {
      var server = new Server();
      server.deserializeClient(function(obj, done) {
        done('pass');
      });
      server.deserializeClient(function(id, done) {
        done(null, null);
      });
      server.deserializeClient(function(obj, done) {
        done(null, { id: '#3' });
      });
      
      describe('deserializing', function() {
        var obj, err;
    
        before(function(done) {
          server.deserializeClient('1', function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should not error', function() {
          expect(err).to.be.null;
        });
        
        it('should invalidate client', function() {
          expect(obj).to.be.false;
        });
      });
    });
    
    describe('multiple deserializers to false', function() {
      var server = new Server();
      server.deserializeClient(function(obj, done) {
        done('pass');
      });
      server.deserializeClient(function(id, done) {
        done(null, false);
      });
      server.deserializeClient(function(obj, done) {
        done(null, { id: '#3' });
      });
      
      describe('deserializing', function() {
        var obj, err;
    
        before(function(done) {
          server.deserializeClient('1', function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should not error', function() {
          expect(err).to.be.null;
        });
        
        it('should invalidate client', function() {
          expect(obj).to.be.false;
        });
      });
    });
    
    describe('deserializer that encounters an error', function() {
      var server = new Server();
      server.deserializeClient(function(obj, done) {
        return done(new Error('something went wrong'));
      });
      
      describe('deserializing', function() {
        var obj, err;
    
        before(function(done) {
          server.deserializeClient('1', function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should error', function() {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('something went wrong')
        });
      });
    });
    
    describe('deserializer that throws an exception', function() {
      var server = new Server();
      server.deserializeClient(function(obj, done) {
        throw new Error('something was thrown');
      });
      
      describe('deserializing', function() {
        var obj, err;
    
        before(function(done) {
          server.deserializeClient('1', function(e, o) {
            err = e;
            obj = o;
            return done();
          });
        });
    
        it('should error', function() {
          expect(err).to.be.an.instanceOf(Error);
          expect(err.message).to.equal('something was thrown')
        });
      });
    });
  
  }); // #deserializeClient
  
});
