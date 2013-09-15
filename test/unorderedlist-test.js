var vows = require('vows');
var assert = require('assert');
var util = require('util');
var UnorderedList = require('../lib/unorderedlist');


vows.describe('UnorderedList').addBatch({
  
  // OK
  'initialized with a single element array': {
    topic: function() {
      return new UnorderedList(['a']);
    },
    
    'should initialize items correctly': function (list) {
      assert.equal(list.length, 1);
      assert.equal(list._items[0], 'a');
    },
    'should return string representation': function (list) {
      assert.equal(list.toString(), 'a');
    },
  },
  
  // OK
  'initialized with a multiple element array': {
    topic: function() {
      return new UnorderedList(['a', 'b']);
    },
    
    'should initialize items correctly': function (list) {
      assert.equal(list.length, 2);
      assert.equal(list._items[0], 'a');
      assert.equal(list._items[1], 'b');
    },
    'should return string representation': function (list) {
      assert.equal(list.toString(), 'a b');
    },
  },
  
  // OK
  'initialized with a string containing no spaces': {
    topic: function() {
      return new UnorderedList('foobar');
    },
    
    'should initialize items correctly': function (list) {
      assert.equal(list.length, 1);
      assert.equal(list._items[0], 'foobar');
    },
  },
  
  // OK
  'initialized with a string containing spaces': {
    topic: function() {
      return new UnorderedList('foo bar');
    },
    
    'should initialize items correctly': function (list) {
      assert.equal(list.length, 2);
      assert.equal(list._items[0], 'foo');
      assert.equal(list._items[1], 'bar');
    },
  },
  
  // OK
  'list with single item': {
    topic: function() {
      return new UnorderedList(['a']);
    },
    
    'should be equal to other list with same item': function (list) {
      var other = new UnorderedList(['a']);
      assert.isTrue(list.equalTo(other));
    },
    'should not be equal to other list with superset of item': function (list) {
      var other = new UnorderedList(['a', 'b']);
      assert.isFalse(list.equalTo(other));
    },
  },
  
  'list with multiple items': {
    topic: function() {
      return new UnorderedList(['a', 'b']);
    },
    
    'should be equal to other list with same set of items in same order': function (list) {
      var other = new UnorderedList(['a', 'b']);
      assert.isTrue(list.equalTo(other));
    },
    'should be equal to other list with same set of items in different order': function (list) {
      var other = new UnorderedList(['b', 'a']);
      assert.isTrue(list.equalTo(other));
    },
    'should not be equal to other list with subset of items': function (list) {
      var other = new UnorderedList(['a']);
      assert.isFalse(list.equalTo(other));
    },
    'should not be equal to other list with superset of items': function (list) {
      var other = new UnorderedList(['a', 'b', 'c']);
      assert.isFalse(list.equalTo(other));
    },
  },
  
}).export(module);
