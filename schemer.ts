'use strict';

const toType = function(obj: Object): string {
    // toType credit goes to Angus Croll @ https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

export class Result {
  invalidProps: string[];
  isValid: boolean;
  reasons: string | Result;

  constructor(invalidProps: string[], reasons) {
    this.invalidProps = invalidProps;
    this.reasons = reasons;
    if (invalidProps.length > 0) {
      this.isValid = false;
    } else {
      this.isValid = true;
    }
  }
}

/** Can be a vallid type as a string or [type] (meaning an array of type) */
export type typeDef = string | [string] | Schema ;

/** Schema property definition */
export interface PropDef {
  type: typeDef;
  /** Property is optional assumed to be false if undefined */
  optional?: boolean | undefined;
  /** Custom checks to be run on the property */
  rules?: [(val: any, type: typeDef) => boolean | Error];
  /** If the property is an array of items, schemerjs will run registered subrules on each item */
  subRules?: [(val: any, type: typeDef) => boolean | Error];
};

/** An dictionary of propDefs where the key is also the name of the property */
export interface Properties {
  [property: string]: PropDef | typeDef
};

export class Schema {
  validTypes: string[] = [
    "object", "array", "arguments", "error", "math", "json", "date", "regexp",
    "string", "boolean", "number", "any"
  ];
  props: Properties;

  constructor(props: Properties) {
    //Check prop syntax for errors
    for (const prop in props) {
      // Test for shortcut syntax and convert to regular syntax
      const isArray = props[prop] instanceof Array;
      const isSchema = props[prop] instanceof Schema;
      const isString = toType(props[prop]) === "string";
      if (isArray || isSchema || isString) {
        const type = props[prop];
        props[prop] = {type} as PropDef;
      }

      if (!this.isValidType((props[prop] as PropDef).type)) {
        throw new Error("Invalid type @: " + prop);
      }
    }
    this.props = props;
  }

  private isValidType(type: typeDef): boolean {
    if (type instanceof Schema) return true;
    if (type instanceof Array) {
      return this.validTypes.indexOf(type[0]) !== -1;
    }
    return this.validTypes.indexOf(type) !== -1;
  }

  getRequiredProps() {
    let props = [];
    for (let prop in this.props) {
      let optional = (this.props[prop] as PropDef).optional;
      if (!optional) {
        props.push(prop);
      }
    }
    return props;
  }

  private validateArray(array, propDef): string | Result {
    let type = propDef.type[0];

    if (toType(array) !== "array") {
      return `Expected an array got: ${toType(array)}`
    }

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

  private validateObjProp(val, propDef) {
    // Validate subschema
    if (propDef.type instanceof Schema) {
      if (toType(val) === "object") {
        return propDef.type.validate(val);
      } else {
        return "is not an an object";
      }
    }

    // Validate array
    if (toType(propDef.type) === "array") {
      return this.validateArray(val, propDef);
    }

    // Check type, immediatley return if there is an error here
    if (toType(val) !== propDef.type && propDef.type !== "any") {
      return "does not match type: " +  propDef.type;
    }

    // Run rule functions
    if (propDef.rules) {
      for (let rule of propDef.rules) {
        let result = rule(val, propDef.type);
        if (result instanceof Error) {
          return result.message;
        } else if (result === false) {
          return "fails against a rule with an undefined message";
        }
      }
    }

    return null;
  }

  validate(obj): Result {
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
        let result = this.validateObjProp(obj[objProp], this.props[objProp]);
        if (result && result.isValid !== true) {
          invalidProps.push(objProp);
          reasons[objProp] = result;
        }
      }
    }

    return new Result(invalidProps, reasons);
  }
}

const messages = {
  max: "Exceeds maximum allowable",
  min: "Does not meet minimum required",
  regex: "Fails regex statement test"
};

export const rules = {
  messages,
  max: function(max: number): (val) => string | Error {
    return function(val): string | Error {
      let success;
      if (toType(val) == "number") {
        success = val <= max;
      } else {
        if (val.length === undefined) {
          throw new Error("Value cannot be compared");
        }
        success = val.length <= max;
      }
      if (!success) return new Error(rules.messages["max"]);
    };
  },
  min: function(minNum: number) {
    return function(val) {
      let success;
      if (toType(val) == "number") {
        success = val >= minNum;
      } else {
        if (val.length === undefined) {
          throw new Error("Value cannot be compared");
        }
        success = val.length >= minNum;
      }
      if (!success) return new Error(rules.messages["min"]);
    };
  },
  regex: function(regStmnt: RegExp) {
    return function(str: string): string | Error {
      let success = regStmnt.test(str);
      if (!success) return new Error(rules.messages.regex);
    };
  },
};
