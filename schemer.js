'use strict';
var toType = function (obj) {
    // toType credit goes to Angus Croll @ https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};
var Result = (function () {
    function Result(invalidProps, reasons) {
        this.invalidProps = invalidProps;
        this.reasons = reasons;
        if (invalidProps.length > 0) {
            this.isValid = false;
        }
        else {
            this.isValid = true;
        }
    }
    return Result;
}());
exports.Result = Result;
;
;
var Schema = (function () {
    function Schema(props) {
        this.validTypes = [
            "object", "array", "arguments", "error", "math", "json", "date", "regexp",
            "string", "boolean", "number", "any"
        ];
        //Check prop syntax for errors
        for (var prop in props) {
            // Test for shortcut syntax and convert to regular syntax
            var isArray = props[prop] instanceof Array;
            var isSchema = props[prop] instanceof Schema;
            var isString = toType(props[prop]) === "string";
            if (isArray || isSchema || isString) {
                var type = props[prop];
                props[prop] = { type: type };
            }
            if (!this.isValidType(props[prop].type)) {
                throw new Error("Invalid type @: " + prop);
            }
        }
        this.props = props;
    }
    Schema.prototype.isValidType = function (type) {
        if (type instanceof Schema)
            return true;
        if (type instanceof Array) {
            return this.validTypes.indexOf(type[0]) !== -1;
        }
        return this.validTypes.indexOf(type) !== -1;
    };
    Schema.prototype.getRequiredProps = function () {
        var props = [];
        for (var prop in this.props) {
            var optional = this.props[prop].optional;
            if (!optional) {
                props.push(prop);
            }
        }
        return props;
    };
    Schema.prototype.validateArray = function (array, propDef) {
        var type = propDef.type[0];
        if (toType(array) !== "array") {
            return "Expected an array got: " + toType(array);
        }
        for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
            var val = array_1[_i];
            if (type instanceof Schema) {
                return type.validate(val);
            }
            else if (toType(val) !== type && type !== "any") {
                return "array item does not match type: " + type + " @ " + val;
            }
            else if (propDef.subRules) {
                for (var _a = 0, _b = propDef.subRules; _a < _b.length; _a++) {
                    var rule = _b[_a];
                    var result = rule(val, type);
                    if (result instanceof Error) {
                        return result.message;
                    }
                    else if (result === false) {
                        return "fails against a subrule with an undefined message";
                    }
                }
            }
        }
    };
    Schema.prototype.validateObjProp = function (val, propDef) {
        // Validate subschema
        if (propDef.type instanceof Schema) {
            if (toType(val) === "object") {
                return propDef.type.validate(val);
            }
            else {
                return "is not an an object";
            }
        }
        // Validate array
        if (toType(propDef.type) === "array") {
            return this.validateArray(val, propDef);
        }
        // Check type, immediatley return if there is an error here
        if (toType(val) !== propDef.type && propDef.type !== "any") {
            return "does not match type: " + propDef.type;
        }
        // Run rule functions
        if (propDef.rules) {
            for (var _i = 0, _a = propDef.rules; _i < _a.length; _i++) {
                var rule = _a[_i];
                var result = rule(val, propDef.type);
                if (result instanceof Error) {
                    return result.message;
                }
                else if (result === false) {
                    return "fails against a rule with an undefined message";
                }
            }
        }
        return null;
    };
    Schema.prototype.validate = function (obj) {
        var invalidProps = [];
        var reasons = {};
        // Make sure all requiredProps are set
        var requiredProps = this.getRequiredProps();
        for (var _i = 0, requiredProps_1 = requiredProps; _i < requiredProps_1.length; _i++) {
            var prop = requiredProps_1[_i];
            if (obj[prop] === undefined) {
                invalidProps.push(prop);
                reasons[prop] = prop + " is required";
            }
        }
        // Make sure all props are valid
        for (var objProp in obj) {
            if (!(objProp in this.props)) {
                invalidProps.push(objProp);
                reasons[objProp] = objProp + " not in schema rules";
            }
            else {
                var result = this.validateObjProp(obj[objProp], this.props[objProp]);
                if (result && result.isValid !== true) {
                    invalidProps.push(objProp);
                    reasons[objProp] = result;
                }
            }
        }
        return new Result(invalidProps, reasons);
    };
    return Schema;
}());
exports.Schema = Schema;
var messages = {
    max: "Exceeds maximum allowable",
    min: "Does not meet minimum required",
    regex: "Fails regex statement test"
};
exports.rules = {
    messages: messages,
    max: function (max) {
        return function (val) {
            var success;
            if (toType(val) == "number") {
                success = val <= max;
            }
            else {
                if (val.length === undefined) {
                    throw new Error("Value cannot be compared");
                }
                success = val.length <= max;
            }
            if (!success)
                return new Error(exports.rules.messages["max"]);
        };
    },
    min: function (minNum) {
        return function (val) {
            var success;
            if (toType(val) == "number") {
                success = val >= minNum;
            }
            else {
                if (val.length === undefined) {
                    throw new Error("Value cannot be compared");
                }
                success = val.length >= minNum;
            }
            if (!success)
                return new Error(exports.rules.messages["min"]);
        };
    },
    regex: function (regStmnt) {
        return function (str) {
            var success = regStmnt.test(str);
            if (!success)
                return new Error(exports.rules.messages.regex);
        };
    },
};
