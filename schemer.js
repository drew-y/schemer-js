'use strict';

const Result = require('./result');

class Schema {
  constructor(props) {
    //Check prop syntax for errors
    for (let prop in props) {
      if (this._toType(props[prop]) !== "object") {
        throw new Error("Invalid porperty description at: " + prop);
      }
      if (!props[prop].type) throw new Error("Type is required @: " + prop);
    }
    this.props = props;
    this.messages = {
      type: "Invalid type",
      arrayType: "Array has values of an invalid type"
    }
  }

  _toType(obj) {
    // toType credit goes to Angus Croll @ https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
  }

  getRequiredProps() {
    let props = [];
    for (let prop of this.props) {
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
    let toType = this._toType;
    if (type !== "any") {
      let success = true;
      array.forEach((val) => {
        if (toType(val) !== type) {
          success = false;
        }
      });

      if (!success) {
        errors.push("Error with " + propName + ": " + this.messages.arrayType);
      }
    }

    if (propDef.subRules) {
      propDef.subRules.forEach((rule) => {
        rule(array, type, propName);
      });
    }
  }

  _validateObjProp(val, propDef, propName) {
    let errors = [];
    // Check type, immediatley return if there is an error here
    if (this._toType(val) !== propDef.type && propDef.type !== "any") {
      return "Error with " + propName + ": " + this.messages.type;
    }

    // Special validation for arrays
    if (this._toType(val) === "array") {
       errors.concat(this._validateArray(val, propDef, propName));
    }

    // Run rule functions
    if (propDef.rules) {
      propDef.rules.forEach((rule) => {
        errors.concat(rule(val, propDef.type, propName));
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
        errors.concat(objPropErrors);
      }
    }

    return new Result(errors);
  }
}

module.exports = Schema;
