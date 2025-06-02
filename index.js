// Main exports for the axsl package
const DSLRunner = require('./src/runner');
const DSLParser = require('./src/parser');
const DSLTemplating = require('./src/templating');
const HttpExecutor = require('./src/executors/http-executor');
const JsExecutor = require('./src/executors/js-executor');

// Export the main runner as the default export
module.exports = DSLRunner;

// Export other components as named exports
module.exports.DSLRunner = DSLRunner;
module.exports.DSLParser = DSLParser;
module.exports.DSLTemplating = DSLTemplating;
module.exports.HttpExecutor = HttpExecutor;
module.exports.JsExecutor = JsExecutor;