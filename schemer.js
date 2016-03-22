'use strict';

const Result = require('./result');

const toType = function (obj) {
    // toType credit goes to Angus Croll @ https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

class Schema {
  constructor(props) {
    //Check prop syntax for errors
    for (let prop in props) {
      if (toType(props[prop]) !== "object") {
        throw new Error("Invalid porperty description at: " + prop);
      }
      if (!props[prop].type) throw new Error("Type is required @: " + prop);
    }
    this.props = props;
    this.messages = {
      type: "Invalid type",
      arrayError: "Array is invalid"
    };
  }

  getRequiredProps() {
    let props = [];
    for (let prop in this.props) {
      let optional = this.props[prop].optional;
      if (!optional) {
        props.push(prop);
      }
    }
    return props;
  }

  _validateArray(array, propDef, propName) {
    let errors = [];
    let type = propDef.type[0];
    let success = true;
    array.forEach((val) => {
      if (type instanceof Schema) {
        let result = type.validate(val);
        return result.errors ? result.errors : [];
      } else if (toType(val) !== type && type !== "any") {
        success = false;
      } else if (propDef.subRules) {
        propDef.subRules.forEach((rule, index) => {
          let result = rule(val, type, propName);
          if (result instanceof Error) {
            errors.push(result.message);
          } else if (result === false) {
            errors.push("fails against rule at index: " + index);
          }
        });
      }
    });

    if (!success) {
      errors.push("Error with " + propName + ": " + this.messages.arrayType);
    }
  }

  _validateObjProp(val, propDef, propName) {
    let errors = [];
    if (propDef.type instanceof Schema) {
      let result = propDef.type.validate(val);
      return result.errors ? result.errors : [];
    }

    // Check type, immediatley return if there is an error here
    if (toType(val) !== propDef.type && propDef.type !== "any") {
      return "Error with " + propName + ": " + this.messages.type;
    }

    // Special validation for arrays
    if (toType(val) === "array") {
       errors = errors.concat(this._validateArray(val, propDef, propName));
    }

    // Run rule functions
    if (propDef.rules) {
      propDef.rules.forEach((rule) => {
        let result = rule(val, propDef.type, propName);
        if (result instanceof Error) {
          errors.push(result.message);
        }
      });
    }

    return errors;
  }

  validate(obj) {
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
    for (let objProp in obj) {
      if (!(objProp in this.props)) {
        errors.push(objProp + " not in schema rules");
      } else {
        let objPropErrors = this._validateObjProp(obj[objProp], this.props[objProp], objProp);
        errors = errors.concat(objPropErrors);
      }
    }

    return new Result(errors);
  }
}

const rules = {
  messages: {
    max: "Exceeds maximum allowable",
    min: "Does not meet minimum required",
    regex: "Fails regex statement test"
  },
  max: function(maxNum) {
    return function(val, message) {
      let success;
      if (toType(val) == "number") {
        success = val < maxNum;
      } else {
        if (val.length === undefined) {
          throw new Error("Value cannot be compared");
        }
        success = val.length < maxNum;
      }
      if (!success) return new Error(message || this.messages.max);
    };
  },
  min: function(minNum) {
    return function(val, message) {
      let success;
      if (toType(val) == "number") {
        success = val > minNum;
      } else {
        if (val.length === undefined) {
          throw new Error("Value cannot be compared");
        }
        success = val.length > minNum;
      }
      if (!success) return new Error(message || this.messages.min);
    };
  },
  regex: function(regStmnt) {
    return function(str, message) {
      let success = regStmnt.test(str);
      if (!success) return new Error(message || this.messages.regex);
    };
  }
};

exports.Schema = Schema;
exports.rules = rules;
