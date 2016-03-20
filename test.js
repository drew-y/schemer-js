'use strict';

const assert = require('assert');
const Schema = require('./schemer');

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
