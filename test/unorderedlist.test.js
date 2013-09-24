var UnorderedList = require('../lib/unorderedlist');
  

describe('UnorderedList', function() {
  
  describe('constructed with a single element array', function() {
    var ul = new UnorderedList(['a']);
    
    it('should have correct length', function() {
      expect(ul).to.have.length(1);
      expect(ul._items[0]).to.equal('a');
    });
    
    it('should convert to string', function() {
      expect(ul.toString()).to.equal('a');
    });
    
    it('should be equal to list with same item', function() {
      var other = new UnorderedList(['a']);
      expect(ul.equalTo(other)).to.be.true;
    });
    
    it('should be equal to array with same item', function() {
      expect(ul.equalTo(['a'])).to.be.true;
    });
    
    it('should not be equal to list with superset of item', function() {
      var other = new UnorderedList(['a', 'b']);
      expect(ul.equalTo(other)).to.be.false;
    });
    
    it('should check if it contains element', function() {
      expect(ul.contains('a')).to.be.true;
      expect(ul.contains('b')).to.be.false;
    });
    
    it('should check if it contains any element', function() {
      expect(ul.containsAny(['a'])).to.be.true;
      expect(ul.containsAny(['b'])).to.be.false;
      expect(ul.containsAny(['1', 'a'])).to.be.true;
      expect(ul.containsAny(['2', 'b'])).to.be.false;
    });
  });
  
  describe('constructed with a multiple element array', function() {
    var ul = new UnorderedList(['a', 'b']);
    
    it('should have correct length', function() {
      expect(ul).to.have.length(2);
      expect(ul._items[0]).to.equal('a');
      expect(ul._items[1]).to.equal('b');
    });
    
    it('should convert to string', function() {
      expect(ul.toString()).to.equal('a b');
    });
    
    it('should be equal to list with same set of items', function() {
      var other = new UnorderedList(['a', 'b']);
      expect(ul.equalTo(other)).to.be.true;
    });
    
    it('should be equal to list with same set of items in different order', function() {
      var other = new UnorderedList(['b', 'a']);
      expect(ul.equalTo(other)).to.be.true;
    });
    
    it('should not be equal to list with subset of items', function() {
      var other = new UnorderedList(['a']);
      expect(ul.equalTo(other)).to.be.false;
    });
    
    it('should not be equal to list with superset of items', function() {
      var other = new UnorderedList(['a', 'b', 'c']);
      expect(ul.equalTo(other)).to.be.false;
    });
    
    it('should check if it contains element', function() {
      expect(ul.contains('a')).to.be.true;
      expect(ul.contains('b')).to.be.true;
      expect(ul.contains('c')).to.be.false;
    });
    
    it('should check if it contains any element', function() {
      expect(ul.containsAny(['a'])).to.be.true;
      expect(ul.containsAny(['b'])).to.be.true;
      expect(ul.containsAny(['c'])).to.be.false;
      expect(ul.containsAny(['1', 'a'])).to.be.true;
      expect(ul.containsAny(['2', 'b'])).to.be.true;
      expect(ul.containsAny(['3', 'c'])).to.be.false;
    });
  });
  
  describe('constructed with string', function() {
    var ul = new UnorderedList('foobar');
    
    it('should have correct length', function() {
      expect(ul).to.have.length(1);
      expect(ul._items[0]).to.equal('foobar');
    });
    
    it('should convert to string', function() {
      expect(ul.toString()).to.equal('foobar');
    });
  });
  
  describe('constructed with space separated string', function() {
    var ul = new UnorderedList('foo bar');
    
    it('should have correct length', function() {
      expect(ul).to.have.length(2);
      expect(ul._items[0]).to.equal('foo');
      expect(ul._items[1]).to.equal('bar');
    });
    
    it('should convert to string', function() {
      expect(ul.toString()).to.equal('foo bar');
    });
  });
  
});
