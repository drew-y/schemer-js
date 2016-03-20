'use strict';
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

module.exports = Result;
