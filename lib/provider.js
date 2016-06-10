'use babel';

var fuzzy = require('fuzzy');
var _ = require('lodash');
var fManager = require('./function-manager');
var fileManager = require('./file-manager');
var fileUtil = require('./common/file-common');
var parser = require('./parser');
var suggestionPanes = { NONE: 0, VARIABLES: 1, FUNCTIONS: 2, DOT: 3};


function createSnippet(functionName, inParams) {
  var snippet = functionName + "(";
  var index = 1;
  _.forEach(inParams, function (value, key) {
    snippet += "${"+(index++)+":"+value.name+" "+value.type+"}, ";
  });
  snippet = snippet.trim().replace(/\,$/, '');
  snippet += ")${"+(index++)+"}";
  return snippet;
}


function onDidInsertSuggestion({editor, triggerPosition, suggestion}) {
  this.activeSuggestion = suggestionPanes.NONE;
}


function init(basePath) {
  this.selector = '.source.sql, .source.pgsql';
  this.disableForSelector = '.source.sql .comment, .source.pgsql .comment';
  this.excludeLowerPriority = true;
  this.inclusionPriority = 1;
  this.lastPrefix = "";
  this.lastRow = 0;
  this.activatedManuallyCount = 0;
  this.activeSuggestion = suggestionPanes.NONE;
  fManager.loadFunctions(basePath);
}

function suggestVariables(prefix) {
  var suggestions = [];
  var variables = fileManager.getVariables();
  var result = _.keys(variables);
  var matches = fuzzyMatch(prefix, result);
  _.forEach(matches, function (value) {
    var variable = variables[value];
    var variableType = variable.type;
    var argmode = variable.argmode;
    var suggestionType = variable.isParam ? "property" : "variable";
    suggestions.push({"text":value, "type": suggestionType, "leftLabel":variableType, "rightLabel": argmode});
  });
  return suggestions;
}

function suggestTokens(prefix) {
  var suggestions = [];
  var tokens = fileManager.getTokens();
  var matches = fuzzyMatch(prefix, tokens);
  _.forEach(matches, function (value) {
    if (prefix != value) {
      suggestions.push({"text":value});
    }
  });
  return suggestions;
}

function suggestFunctions(prefix) {
  var suggestions = [];
  var functions = fManager.getFunctions();
  var result = _.keys(functions);
  var matches = fuzzyMatch(prefix, result);
  _.forEach(matches, function (value) {
    match = functions[value][0];
    var snippet = createSnippet(value, match.params.in);
    suggestions.push({"text":value, "type":"function", "leftLabel":match.returnType, "snippet":snippet});
  });
  return suggestions;
}

function suggestDot(line, prefix) {
  var suggestions = [];
  var functionName = parser.getFunctionNameOnDot(line);
  var functions = fManager.getFunctions();
  var parsedFunction = functions[functionName];
  if (parsedFunction !== undefined) {
    var outParams = parsedFunction[0].params.out;
    if (prefix !== undefined) {
      var keys = _.keys(outParams);
      var matches = fuzzyMatch(prefix, keys);
      _.forEach(matches, function (value) {
        var param = outParams[value];
        suggestions.push({"text": param.name, "type": param.type, "rightLabel": param.argmode, "leftLabel": "property"});
      });
    } else {
      _.forEach(outParams, function (value, key) {
        suggestions.push({"text": value.name, "type": value.type, "rightLabel": value.argmode, "leftLabel": "property"});
      });
    }
  }
  return suggestions;
}

function fuzzyMatch(prefix, array) {
  var filterArray = fuzzy.filter(prefix, array);
  var matches = filterArray.map(function(el) {
    return el.string;
  });
  return matches;
}


function getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
  var allSuggestions = [];
  var variablesSuggestions = [];
  var tokensSuggestions = [];
  var functionsSuggestions = [];
  var dotSuggestions = [];
  var line = fileUtil.getLine(editor, bufferPosition);
  var isDotSuggestion = parser.isDotSuggestion(line);
  if (this.lastRow !== bufferPosition.row) {
    this.activeSuggestion = suggestionPanes.NONE;
  }
  if (prefix === '.') {
    this.activeSuggestion = suggestionPanes.DOT;
    dotSuggestions = suggestDot(line);
  } else {
    if (isDotSuggestion) {
      this.activeSuggestion = suggestionPanes.DOT;
    } else if (prefix.length < 2) {
      this.activeSuggestion = suggestionPanes.NONE;
      return;
    } else if (prefix.indexOf(this.lastPrefix) === -1) {
      if (this.lastPrefix.indexOf(prefix) === -1) {
        this.activeSuggestion = suggestionPanes.NONE;
      }
    }
    switch (this.activeSuggestion) {
      case suggestionPanes.NONE:
        this.activeSuggestion = suggestionPanes.VARIABLES;
        break;
      case suggestionPanes.VARIABLES:
        if (activatedManually !== undefined) {
          this.activeSuggestion = suggestionPanes.FUNCTIONS;
        }
        break;
      case suggestionPanes.FUNCTIONS:
        if (activatedManually !== undefined) {
          this.activeSuggestion = suggestionPanes.VARIABLES;
        }
        break;
      case suggestionPanes.DOT:

        break;
      default:
    }

    if (this.activeSuggestion === suggestionPanes.VARIABLES) {
      var fileContent = atom.workspace.getActiveTextEditor().getText();
      if (fileContent !== null) {
        fileManager.loadCurrentFile(fileContent);
      }
      // VARIABLES
      variablesSuggestions = suggestVariables(prefix);

      // TOKENS
      tokensSuggestions = suggestTokens(prefix);
    } else if (this.activeSuggestion === suggestionPanes.FUNCTIONS) {
      functionsSuggestions = suggestFunctions(prefix);
    } else if (this.activeSuggestion === suggestionPanes.DOT) {
      dotSuggestions = suggestDot(line, prefix);
    }
    this.lastPrefix = prefix;
  }
  this.lastRow = bufferPosition.row;
  allSuggestions = _.concat(variablesSuggestions, tokensSuggestions, functionsSuggestions, dotSuggestions);
  return allSuggestions;
}

export default {
    init:init,
    getSuggestions: getSuggestions,
    onDidInsertSuggestion: onDidInsertSuggestion
}
