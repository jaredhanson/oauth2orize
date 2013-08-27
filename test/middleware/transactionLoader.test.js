var chai = require('chai')
  , transactionLoader = require('../../lib/middleware/transactionLoader')
  , Server = require('../../lib/server');


describe('transactionLoader', function() {
  
  var server = new Server();
  server.deserializeClient(function(id, done) {
    if (id !== '1') { return done(new Error('deserializeClient failure')); }
    return done(null, { id: id, name: 'Test' })
  });
  
  it('should be named transactionLoader', function() {
    expect(transactionLoader(server).name).to.equal('transactionLoader');
  });
  
  describe('handling a request with transaction id in query', function() {
    var request, err;

    before(function(done) {
      chai.connect(transactionLoader(server))
        .req(function(req) {
          request = req;
          req.query = { 'transaction_id': '1234' }
          req.session = {};
          req.session.authorize = {};
          req.session.authorize['1234'] = {
            client: '1',
            redirectURI: 'http://www.example.com/auth/callback',
            req: { redirectURI: 'http://www.example.com/auth/callback', foo: 'bar' }
          }
        })
        .next(function(e) {
          err = e;
          done();
        })
        .dispatch();
    });
    
    it('should not error', function() {
      expect(err).to.be.undefined;
    });
    
    it('should restore transaction', function() {
      expect(request.oauth2).to.be.an('object');
      expect(request.oauth2.transactionID).to.equal('1234');
      expect(request.oauth2.client.id).to.equal('1');
      expect(request.oauth2.client.name).to.equal('Test');
      expect(request.oauth2.redirectURI).to.equal('http://www.example.com/auth/callback');
      expect(request.oauth2.req.redirectURI).to.equal('http://www.example.com/auth/callback');
      expect(request.oauth2.req.foo).to.equal('bar');
    });
    
    it('should leave transaction in session', function() {
      expect(request.session['authorize']['1234']).to.be.an('object');
    });
  });
  
});

