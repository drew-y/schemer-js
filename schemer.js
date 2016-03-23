'use strict';

const toType = function (obj) {
    // toType credit goes to Angus Croll @ https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

class Result {
  constructor(invalidProps, reasons) {
    this.invalidProps = invalidProps;
    this.reasons = reasons;
    if (invalidProps.length > 0) {
      this.isValid = false;
    } else {
      this.isValid = true;
    }
  }
}

class Schema {
  constructor(props) {
    this.validTypes = ["object", "array", "arguments", "error",
    "math", "json", "date", "regexp", "string", "boolean", "number"];
    //Check prop syntax for errors
    for (let prop in props) {
      if (this.validTypes.indexOf(props[prop]) !== -1 ||
          props[prop] instanceof Schema) {
        // Convert shortcut syntax (i.e prop: "string") into prop: {type: "string"}
        let type = props[prop];
        props[prop] = {type};
      } else if (toType(props[prop]) !== "object") {
        throw new Error("Invalid porperty description at: " + prop);
      }
      if (!props[prop].type) throw new Error("Type is required @: " + prop);
    }
    this.props = props;
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

  _validateArray(array, propDef) {
    let type = propDef.type[0];

    for (let val of array) {
      if (type instanceof Schema) {
        return type.validate(val);
      } else if (toType(val) !== type && type !== "any") {
        return "array item does not match type: " + type + " @ " + val;
      } else if (propDef.subRules) {
        for (let rule of propDef.subRules) {
          let result = rule(val, type);
          if (result instanceof Error) {
            return result.message;
          } else if (result === false) {
            return "fails against a subrule with an undefined message";
          }
        }
      }
    }
  }

  _validateObjProp(val, propDef) {
    if (propDef.type instanceof Schema) {
      if (toType(val) === "object") {
        return propDef.type.validate(val);
      } else {
        return "is not an an object";
      }
    }

    // Check type, immediatley return if there is an error here
    if (toType(val) !== propDef.type && propDef.type !== "any") {
      return "does not match type: " +  propDef.type;
    }

    // Special validation for arrays
    if (toType(val) === "array") {
       return this._validateArray(val, propDef);
    }

    // Run rule functions
    if (propDef.rules) {
      propDef.rules.forEach((rule) => {
        let result = rule(val, propDef.type);
        if (result instanceof Error) {
          return result.message;
        } else if (result === false) {
          return "fails against a rule with an undefined message";
        }
      });
    }

    return null;
  }

  validate(obj) {
    let invalidProps = [];
    let reasons = {};

    // Make sure all requiredProps are set
    let requiredProps = this.getRequiredProps();
    for (let prop of requiredProps) {
      if (obj[prop] === undefined) {
        invalidProps.push(prop);
        reasons[prop] = prop + " is required";
      }
    }

    // Make sure all props are valid
    for (let objProp in obj) {
      if (!(objProp in this.props)) {
        invalidProps.push(objProp);
        reasons[objProp] = objProp + " not in schema rules";
      } else {
        let result = this._validateObjProp(obj[objProp], this.props[objProp]);
        if (result && result.isValid !== true) {
          invalidProps.push(objProp);
          reasons[objProp] = result;
        }
      }
    }

    return new Result(invalidProps, reasons);
  }
}

let rules = {};
rules.messages = {
  max: "Exceeds maximum allowable",
  min: "Does not meet minimum required",
  regex: "Fails regex statement test"
};

rules.max = function(maxNum) {
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
    if (!success) return new Error(message || rules.messages.max);
  };
};

rules.min = function(minNum) {
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
    if (!success) return new Error(message || rules.messages.min);
  };
};

rules.regex = function(regStmnt) {
  return function(str, message) {
    let success = regStmnt.test(str);
    if (!success) return new Error(message || rules.messages.regex);
  };
};

exports.Schema = Schema;
exports.Result = Result;
exports.rules = rules;
