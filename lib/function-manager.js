'use babel';


var parser = require('./parser');
var functions = {};

export default {

  loadFunctions(basePath) {
    parser.parseFunctions(basePath, (functionsData) => {
      functions = functionsData;
    });
  },

  getFunctions() {
    return functions;
  },

}
