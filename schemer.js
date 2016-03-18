'use strict';

/*
  Helper functions:
  toType credit goes to Angus Croll @ https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
*/
const toType = function(obj) {
  return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

class Result {
  constructor(errors) {
    errors = errors || [];
    if (errors.length > 0) {
      this.isValid = false;
      this.errors = errors;
    } else {
      this.isValid = true;
      this.errors = null;
    }
  }
}

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

  getRequiredProps() {
    let props = [];
    for (let prop of this.rules) {
      let required = this.rules[prop].required;
      if (required === undefined || required === true) {
        props.push(prop);
      }
    }
    return props;
  }

  matchesType(obj, type) {
    if (!type) throw new Error("Type is required");
    if (type instanceof Schema) {
      return type.validate(obj).isValid;
    } else if (toType(type) === "array" && toType(obj) === "array") {
        let subtype = toType(type[0]);
        return this.validateArray(obj, subtype);
    } else {
      return toType(obj) === type;
    }
  }

  min(val, length) {
    return val.length < length;
  }

  max(val, length) {
    return val.length > length;
  }

  regex(str, exp) {
    if (toType(str) !== "string") throw new Error("Regex can only be tested on strings");
    return exp.test(str);
  }

  validateArray(obj, type) {
    let success = true;
    obj.forEach((val) => {
      if (toType(val) === type) success = false;
    });
    return success;
  }

  validateProp(prop, propRules) {
    let success = true;
    for (let rule of propRules) {
      if (!this[rule](prop, propRules[rule])) {
        success = false;
      }
    }
  }

  validate(obj) {
    let rules = this.rules;
    let requiredProps = this.getRequiredProps();
    let errors = [];
    let satisfiedProps = 0;

    // Make sure all requiredProps are set
    for (let prop of requiredProps) {
      if (obj[prop] === undefined) {
        errors.push(prop + " is required");
      }
    }

    // Make sure all props are valid
    for (let prop in obj) {
      if (!(prop in this.rules)) {
        errors.push(prop + " not in schema rules");
      } else {

      }
    }

    return new Result(errors);
  }
}

module.exports = Schema;
