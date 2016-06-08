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
    this.lastPrefix = "";
    this.activatedManuallyCount = 0;
    fManager.loadFunctions(basePath);
  }

  getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    if (prefix.length < 2){
        return;
    }
    var checkFunctions = false;
    if (this.lastPrefix == prefix) {
      checkFunctions = this.activatedManuallyCount % 2 === 0;
      this.activatedManuallyCount++;
    } else {
      this.activatedManuallyCount = 0;
      this.lastPrefix = prefix;
      checkFunctions = activatedManually;
    }
    var checkVariables = prefix.length > 1;
    var checkTokens = prefix.length > 3;

    //Must get the prev word and evaluate if it is (FROM or .)
    self = this;
    let allSuggestions = new Array();
    var match = undefined;

    var fileContent = atom.workspace.getActiveTextEditor().getText();
    if (fileContent !== null) {
      fileManager.loadCurrentFile(fileContent);
    }
    // Variables
    if (checkVariables) {
      var variables = fileManager.getVariables();
      var result = _.keys(variables);
      var results = fuzzy.filter(prefix, result);
      var matches = results.map(function(el) {
        return el.string;
      });
      _.forEach(matches, function (value) {
        var variable = variables[value];
        var variableType = variable.type;
        var argmode = variable.argmode;
        var suggestionType = variable.isParam ? "property" : "variable";
        allSuggestions.push({"text":value, "type": suggestionType, "leftLabel":variableType, "rightLabel": argmode});
      });
    }

    // Tokens
    if (checkTokens) {
      var tokens = fileManager.getTokens();
      var results = fuzzy.filter(prefix, tokens);
      var matches = results.map(function(el) {
        return el.string;
      });
      _.forEach(matches, function (value) {
        if (prefix != value) {
          allSuggestions.push({"text":value});
        }
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
