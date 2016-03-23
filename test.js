'use strict';

const assert = require('assert');
const Schema = require('./schemer').Schema;
const rules = require('./schemer').rules;

describe('Schema', function() {
  let subModel;
  let testModel;

  beforeEach(function() {
    subModel = new Schema({
      foo: {
        type: 'string'
      },
      bar: {
        type: 'number'
      }
    });

    testModel = new Schema({
      foo: {
        type: 'string'
      },
      bar: {
        type: 'number'
      },
      bleh: {
        type: subModel
      }
    });
  });

  describe('validation', function() {
    it('returns isValid = true with valid JSON', function() {
      let testJSON = {
        foo: "me",
        bar: 5,
        bleh: {
          foo: "who?",
          bar: 4
        }
      };

      let result = testModel.validate(testJSON);
      console.log(result);
      assert(result.isValid === true);
    });

    it('catches an invalid type', function() {
      let testJSON = {
        foo: 5, // Should be a string
        bar: 5,
        bleh: {
          foo: "who?",
          bar: 4
        }
      };

      let result = testModel.validate(testJSON);
      assert(result.isValid === false);
    });

    it('catches an invalid type in subschema', function() {
      let testJSON = {
        foo: "me",
        bar: 5,
        bleh: {
          foo: "who?",
          bar: function() { // Should be a number
            console.log("you've been hacked!");
          }
        }
      };

      let result = testModel.validate(testJSON);
      assert(result.isValid === false);
    });
  });
});

describe('rules', function() {
  describe('min', function() {
    let min = rules.min(5);

    it('should return an error with a number less than min', function() {
      let result = min(4);
      assert(result instanceof Error);
    });

    it('should not return an error with a number greater than min', function() {
      let result = min(6);
      assert(!(result instanceof Error));
    });

    it('should return an error with a string less than min', function() {
      let result = min("abc");
      assert(result instanceof Error);
    });

    it('should not return an error with a string greater than min', function() {
      let result = min("abcdef");
      assert(!(result instanceof Error));
    });

    it('should return an error with an array less than min', function() {
      let result = min([1,2,3]);
      assert(result instanceof Error);
    });

    it('should not return an error with an array greater than min', function() {
      let result = min([1,2,3,4,5,6]);
      assert(!(result instanceof Error));
    });

    it('should throw an error', function() {
      assert.throws(() => {
        min(undefined);
      });
    });
  });

  describe('max', function() {
    let max = rules.max(5);

    it('should return an error with a number greater than max', function() {
      let result = max(8);
      assert(result instanceof Error);
    });

    it('should not return an error with a number less than max', function() {
      let result = max(3);
      assert(!(result instanceof Error));
    });

    it('should return an error with a string greater than max', function() {
      let result = max("abcdefg");
      assert(result instanceof Error);
    });

    it('should not return an error with a string less than max', function() {
      let result = max("abcf");
      assert(!(result instanceof Error));
    });

    it('should return an error with an array greater than max', function() {
      let result = max([1,2,3,5,6,7]);
      assert(result instanceof Error);
    });

    it('should not return an error with an array less than max', function() {
      let result = max([1,2,3,4]);
      assert(!(result instanceof Error));
    });

    it('should throw an error', function() {
      assert.throws(() => {
        max(undefined);
      });
    });
  });
});
