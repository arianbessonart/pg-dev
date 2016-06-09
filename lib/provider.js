'use babel';

var fuzzy = require('fuzzy');
var _ = require('lodash');
var fManager = require('./function-manager');
var fileManager = require('./file-manager');

export default class PgProvider {
  constructor(basePath) {
    this.selector = '.source.sql, .source.pgsql';
    this.disableForSelector = '.source.sql .comment, .source.pgsql .comment';
    this.excludeLowerPriority = true;
    this.inclusionPriority = 1;
    this.storeData = {};
    this.lastPrefix = "";
    this.activatedManuallyCount = 0;
    this.functionsSuggestionActive = false;
    fManager.loadFunctions(basePath);
  }

  getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    if (prefix.length < 2){
        return;
    }
    // TODO: Please make a refactor
    var checkFunctions = false;
    if (this.lastPrefix == prefix) {
      if (activatedManually !== undefined) {
        this.functionsSuggestionActive = true;
        this.activatedManuallyCount++;
      }
    } else {
      if (prefix.indexOf(this.lastPrefix) === -1) {
        if (this.lastPrefix.indexOf(prefix) === -1) {
          this.functionsSuggestionActive = false;
          this.activatedManuallyCount = 0;
        }
      }
    }
    this.lastPrefix = prefix;

    checkFunctions = this.functionsSuggestionActive && this.activatedManuallyCount % 2 !== 0;
    var checkVariables = prefix.length > 1 && !checkFunctions;
    var checkTokens = prefix.length > 3 && !checkFunctions;

    //Must get the prev word and evaluate if it is (FROM or .)
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

  onDidInsertSuggestion({editor, triggerPosition, suggestion}) {
    this.functionsSuggestionActive = false;
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
