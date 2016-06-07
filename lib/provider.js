'use babel';

var fuzzy = require('fuzzy');
var _ = require('lodash');
var fManager = require('./function-manager');
var fileManager = require('./file-manager');

export default class PgProvider {
  constructor(basePath) {
    self = this;
    this.selector = '.source.sql';
    this.disableForSelector = '.source.sql .comment';
    this.excludeLowerPriority = true;
    this.inclusionPriority = 1;
    this.storeData = {};
    fManager.loadFunctions(basePath);
  }

  getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    if (prefix.length < 2){
        return;
    }

    var checkFunctions = activatedManually;
    var checkVariables = prefix.length > 1;

    //Must get the prev word and evaluate if it is (FROM or .)
    self = this;
    let allSuggestions = new Array();
    var match = undefined;

    // Variables
    if (checkVariables) {
      var variables = fileManager.getVariables();
      var result = _.keys(variables);
      var results = fuzzy.filter(prefix, result);
      var matches = results.map(function(el) {
        return el.string;
      });
      _.forEach(matches, function (value) {
        var variableType = variables[value];
        allSuggestions.push({"text":value, "type": "variable", "leftLabel":variableType});
      });
    }


    // Functions
    if (checkFunctions) {
      var functions = fManager.getFunctions();
      var result = _.keys(functions);
      var results = fuzzy.filter(prefix, result);
      var matches = results.map(function(el) {
        return el.string;
      });
      _.forEach(matches, function (value) {
        match = functions[value][0];
        var snippet = PgProvider.createSnippet(value, match.params.in);
        allSuggestions.push({"text":value, "type":"function", "leftLabel":match.returnType, "snippet":snippet});
      });
    }


    return allSuggestions;
  }

  static createSnippet(functionName, inParams) {
    var snippet = functionName + "(";
    var index = 1;
    _.map(inParams, (param) => {
      snippet += "${"+(index++)+":"+param.name+" "+param.type+"}, ";
    });
    snippet = snippet.trim().replace(/\,$/, '');
    snippet += ")${"+(index++)+"}";
    return snippet;
  }


}
