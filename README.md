# SchemerJS (Name in progress)

SchemerJS is a simple object schema validation library.

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

### type

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

### optional

A boolean representing whether the property is needed for the object to be
considered valid. defaults to false.

### rules

An array of functions that return either a boolean or an `Error`. The object
being validated is considered to be invalid if the function returns false
or an error. The error.message is listed as a reason for failure if specified.

### subRules

Sub-rules are like regular rules except they are run on each value of an array.
