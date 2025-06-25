// This line must come before importing any instrumented module.
const tracer = require("dd-trace").init();

module.exports = tracer;
