'use strict';

const assert = require('assert');
const Schema = require('./schemer');

describe('Schema', function() {
  let subModel = new Schema({
    foo: {
      type: 'string'
    },
    bar: {
      type: 'number'
    }
  });

  let testModel = new Schema({
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
