'use strict';

class Schema {
  constructor(rules) {
    //Check rules syntax for errors
    for (let rule in rules) {
      if (toType(rules[rule]) !== "object") {
        throw new Error("Invalid rule description at: " + rule);
      }
      if (!rules[rule].type) throw new Error("Type is required @: " + rule);
    }
    this.rules = rules;
  }

  findRequiredKeys() {
    let keys = [];
    for (let key of this.rules) {
      let required = this.rules[key].required;
      if (required === undefined || required === true) {
        keys.push(key);
      }
    }
    return keys;
  }

  validate(obj) {
    let rules = this.rules;
    let requiredKeys = this.findRequiredKeys();
    return new Promise((resolve, reject) => {
      let errors = [];
      let satisfiedKeys = 0;

      // Make sure all keys are valid
      for (let key in obj) {
        if (!(key in this.rules)) {
          errors.push(key + " not in schema rules");
          continue;
        }
      }

      if (errors.length > 0) {
        reject(errors);
      } else {
        resolve();
      }
    });
  }
}

module.exports = Schema;

/*
  toType credit goes to Angus Croll @ https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
*/
const toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

/*
  Validator functions
*/

const matchesType = function(obj, type) {
  if (!type) throw new Error("Type is required");
  return new Promise((resolve, reject) => {
    if (type instanceof Schema) {
      type.validate(obj).then(resolve()).catch(reject());
    } else if (toType(type) === "array" && toType(obj) === "array") {
        let subtype = toType(type[0]);
    } else if (toType(obj) === type) {
      resolve();
    } else {
      reject();
    }
  });
};

const validateArray = function(obj, type, resolve, reject) {
  let success = true;
  obj.forEach((val) => {
    if (toType(val) === type) success = false;
  });
  let outcome = success ? resolve: reject;
  outcome();
};

const min = function(val, length) {
  return val.length < length;
};

const max = function(val, length) {
  return val.length > length;
};

const regex = function(str, exp) {
  if (toType(str) !== "string") throw new Error("Regex can only be tested on strings");
  return exp.test(str);
};
