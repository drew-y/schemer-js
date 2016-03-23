'use strict';

const assert = require('assert');
const Schema = require('./schemer').Schema;
const rules = require('./schemer').rules;

describe('Schema', function() {
  describe('validation', function() {
    it('returns isValid = true with valid JSON', function() {
      let test = new Schema({
        hello: {
          type: "string"
        }
      });

      let testJSON = {
        hello: "world"
      };

      let result = test.validate(testJSON);
      assert(result.isValid === true);
    });

    it('catches an invalid type and returns invalid fields', function() {
      let test = new Schema({
        foo: {
          type: "string"
        },
        bar: {
          type: "number"
        },
        bleh: {
          type: ["number"]
        }
      });

      let testJSON = {
        foo: 5, // Should be a string
        bar: 5,
        bleh: "adfshlasdfkj"
      };

      let result = test.validate(testJSON);
      assert(result.isValid === false);
      assert(result.invalidProps[0] == 'foo');
      assert(result.invalidProps[1] == 'bleh');
      assert(result.reasons.hasOwnProperty('foo'));
      assert(result.reasons.hasOwnProperty('bleh'));
    });

    it('allows shorthand syntax', function() {
      let test = new Schema({
        foo: "string",
        bar: new Schema({
          bleh: "number"
        })
      });
      let success = {
        foo: "hola",
        bar: {
          bleh: 5
        }
      };
      let fail = {
        foo: 5,
        bar: "k?"
      };
      assert(test.validate(success).isValid);
      assert(!test.validate(fail).isValid);
    });

    it('catches an invalid type in subschema', function() {
      let test = new Schema({
        bleh: {
          type: new Schema({
            bar: "string"
          })
        }
      });
      let testJSON = {
        bleh: {
          bar: function() { // Should be a number
            console.log("you've been hacked!");
          }
        }
      };

      let result = test.validate(testJSON);
      assert(result.reasons.bleh.reasons.bar === 'does not match type: string');
    });

    it('validates arrays', function() {
      let test = new Schema({
        foo: ["string"],
        bar: ["any"],
        bleh: {
          type: ["string"],
          subRules: [
            rules.min(3),
            rules.max(7)
          ]
        }
      });

      let success = test.validate({
        foo: ['dflahjd', 'thbase'],
        bar: [1, 4, 'fasda'],
        bleh: ["jksk", 'holag']
      });
      console.log(success);
      assert(success.isValid);
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
