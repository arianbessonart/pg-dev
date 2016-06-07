'use babel';


var Parser = require('./parser/parser');
var functions = {};

export default {

  loadFunctions(basePath) {
    this.parser = new Parser();
    this.parser.parseFunctions(basePath, (functionsData) => {
      functions = functionsData;
    });
  },

  getFunctions() {
    return functions;
  },

}
