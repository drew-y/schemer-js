# SchemerJS

A simple JavasScript object modeling and validation library.

## Basic Example:

```javascript
const Schema = require("schemerjs").Schema;
const rules = require("schemerjs").rules;

let User = new Schema({
  firstname: "string",
  lastname: "string",
  bio: {
    type: "string",
    optional: true,
    rules: [
      rules.max(150)
    ]
  }
});

let fakeUser = {
  firstname: "John",
  lastname: "Doe",
  bio: "A generic person"
}

let result = User.validate(fakeUser);

console.log(result) // {isValid: true, invalidProps: [], reasons: {}}
```

## Schema Definition:

Each property definition takes the following syntax:

```javascript
let example = new Schema({
  propName: {
    type: ["string"],
    optional: true,
    rules: [],
    subRules: []
  }
});
```

Where `propName` is the property to be validated. If the object being validated
has a property not defined in the schema, the object is considered to be
invalid.

If all you care about is the key name and type you can use the shorthand
syntax like this:

```javascript
let example = new Schema({
  keyName: "number"
});
```

## Schema Property Constraints:

(The constraints that go inside of the the property definition)

### type `String`

The type the property must be.

##### Valid types:

- `"string"`
- `"number"`
- `"boolean"`
- `"array"`
- `"object"`
- `"date"`
- `"math"`
- `"regexp"`
- `"json"`
- `"error"`

For a property of an unspecified type use `"any"`. To specify an array of a
certain type use the syntax: `["type"]` (Note that the array is itself not a
string).

You can also set the type to another SchemerJS schema:

```javascript
  let SubSchema = new Schema({
    bar: {
      type: "string"
    }
  });

  let TopSchema = new Schema({
    foo: {
      type: SubSchema
    },
    arrayofsubschema: {
      type: [SubSchema]
    }
  });
```

### optional `Boolean`

A boolean representing whether the property is needed for the object to be
considered valid. defaults to false.

### rules `[functions]`

An array of functions that return either a `Boolean` or an `Error`. The object
being validated is considered to be invalid if the function returns false
or an error. The error.message is listed as a reason for failure if specified.

##### Example:

```javascript
let ruleFunc = function(val) {
    // returns an error if val !== "world"
    if (val !== "world") {
      return new Error("does not equal world");
    }
};

let Example = new Schema({
  hello: {
    type: "string",
    rules: [
      ruleFunc // Note the we do not call ruleFunc here i.e. don't do ruleFunc()
    ]
  }
});

let pass = Example.validate({hello: "world"}); // isValid == true
let fail = Example.validate({hello: "world"}); // isValid == false
```

### subRules `[functions]`

Sub-rules are like regular rules except they are run on each value of an array.

## Schema Functions:

### validate `Schema.validate(object)`

Returns an object with the following properties:

- isValid `Boolean`
- invalidProps `["string"]`
- reasons `"Object" // error messages for each of the invalidProps`

### getRequiredProps `Schema.getRequiredProps()`

Returns an `Array` of all the props needed for an object validated with this
schema definition to be considered valid.

## Predefined rules:

SchemerJS comes with a few predefined rules for convenience.

- min
- max
- regex

Usage:

```javascript
const Schema = require("schemerjs").Schema;
const rules = require("schemerjs").rules;

let Example = new Schema({
  hello: {
    type: "string",
    rules: [
      min(1), // We use () because these functions return another function
      max(6),
      regex(/world/)
    ]
  }
});
```

### min `min(num)`

Takes a `Number` and returns a `Function`. The function that max returns can be
passed a `Number` `String` or `Array`. With a `Number` the function returns an
`Error` if the value the function is given is less than the number passed to
min. With a `String` or an `Array` the function returns an `Error` if the the
value.length the function is given is less than the number passed to min.

Usage:

```javascript
const rules = require("schemerjs").rules;

let lessThanFive = rules.min(5);

let passNum = lessThanFive(7); // returns undefined
let failNum = lessThanFive(2); // returns an Error
let passStr = lessThanFive('abcdefg'); // returns undefined
let failStr = lessThanFive('abc'); //returns an Error
let passArr = lessThanFive([1,2,3,4,5,6])// returns undefined
let failArr = lessThanFive([1,2,3])// returns an Error
```

### max `max(num)`

Takes a `Number` and returns a `Function`. The function that max returns can be
passed a `Number` `String` or `Array`. With a `Number` the function returns an
`Error` if the value the function is given is greater than the number passed to
max. With a `String` or an `Array` the function returns an `Error` if the the
value.length the function is given is greater than the number passed to max.

Usage:

```javascript
const rules = require("schemerjs").rules;

let greaterThanFive = rules.max(5);

let passNum = greaterThanFive(2); // returns undefined
let failNum = greaterThanFive(7); // returns an Error
let passStr = greaterThanFive('abc'); // returns undefined
let failStr = greaterThanFive('abcdefg'); //returns an Error
let passArr = greaterThanFive([1,2,4])// returns undefined
let failArr = greaterThanFive([1,2,3,4,5,6])// returns an Error
```

### regex `regex(regExp)`

Takes a regular expression and returns a `Function`. The function that regex
returns can be passed a `String`. If this `String` does not pass the regex test
it returns an error

Usage:

```javascript
const rules = require("schemerjs").rules;

let onlyWorld = rules.regex(/world/);

let pass = onlyWorld("world"); // returns undefined
let fail = onlyWorld("hello"); // returns an Error
```
