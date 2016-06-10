'use babel';

var fuzzy = require('fuzzy');
var _ = require('lodash');
var fManager = require('./function-manager');
var fileManager = require('./file-manager');
var fileUtil = require('./common/file-common');
var suggestionPanes = { NONE: 0, VARIABLES: 1, FUNCTIONS: 2, DOT: 3};


function createSnippet(functionName, inParams) {
  var snippet = functionName + "(";
  var index = 1;
  _.map(inParams, (param) => {
    snippet += "${"+(index++)+":"+param.name+" "+param.type+"}, ";
  });
  snippet = snippet.trim().replace(/\,$/, '');
  snippet += ")${"+(index++)+"}";
  return snippet;
};


function onDidInsertSuggestion({editor, triggerPosition, suggestion}) {
  this.activeSuggestion = suggestionPanes.NONE;
};


function init(basePath) {
  this.selector = '.source.sql, .source.pgsql';
  this.disableForSelector = '.source.sql .comment, .source.pgsql .comment';
  this.excludeLowerPriority = true;
  this.inclusionPriority = 1;
  this.lastPrefix = "";
  this.activatedManuallyCount = 0;
  this.activeSuggestion = suggestionPanes.NONE;
  fManager.loadFunctions(basePath);
}

function suggestVariables(prefix) {
  var suggestions = [];
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
    suggestions.push({"text":value, "type": suggestionType, "leftLabel":variableType, "rightLabel": argmode});
  });
  return suggestions;
}

function suggestTokens(prefix) {
  var suggestions = [];
  var tokens = fileManager.getTokens();
  var results = fuzzy.filter(prefix, tokens);
  var matches = results.map(function(el) {
    return el.string;
  });
  _.forEach(matches, function (value) {
    if (prefix != value) {
      suggestions.push({"text":value});
    }
  });
  return suggestions;
}

function suggestTokens(prefix) {
  var suggestions = [];
  var tokens = fileManager.getTokens();
  var results = fuzzy.filter(prefix, tokens);
  var matches = results.map(function(el) {
    return el.string;
  });
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
  var results = fuzzy.filter(prefix, result);
  var matches = results.map(function(el) {
    return el.string;
  });
  _.forEach(matches, function (value) {
    match = functions[value][0];
    var snippet = createSnippet(value, match.params.in);
    suggestions.push({"text":value, "type":"function", "leftLabel":match.returnType, "snippet":snippet});
  });
  return suggestions;
}

function getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
  var allSuggestions = [];
  var variablesSuggestions = [];
  var tokensSuggestions = [];
  var functionsSuggestions = [];
  if (prefix === '.') {

  } else {
    if (prefix.length < 2) {
      this.activeSuggestion = suggestionPanes.NONE;
      return;
    }
    if (prefix.indexOf(this.lastPrefix) === -1) {
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
    }
    this.lastPrefix = prefix;
    allSuggestions = _.concat(variablesSuggestions, tokensSuggestions, functionsSuggestions);
    return allSuggestions;
  }
};

export default {
    init:init,
    getSuggestions: getSuggestions,
    onDidInsertSuggestion: onDidInsertSuggestion
}





  // getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
  //   let allSuggestions = new Array();
  //   if (prefix === ".") {
  //     activeSuggestion = suggestionPanes.DOT;
  //     var line = fileUtil.getLine(editor, bufferPosition);
  //     var lineCursor = line.substring(0, bufferPosition.column);
  //     var i = lineCursor.length;
  //     var o = '';
  //     var goOn = true;
  //     var closeParenthesisCount = 0;
  //     while (i > 0 && goOn) {
  //       o = lineCursor.substring(i - 1, i);
  //       if (o === ')') {
  //         closeParenthesisCount++;
  //       } else if (o === '(') {
  //         goOn = false;
  //         i++;
  //       }
  //       i--;
  //     }
  //     if (!goOn) {
  //       goOn = true;
  //       while (i > 0 && goOn) {
  //         o = lineCursor.substring(i - 1, i);
  //         if (o === '(') {
  //           closeParenthesisCount--;
  //         }
  //         if (closeParenthesisCount === 1) {
  //           goOn = false;
  //         }
  //         i--;
  //       }
  //       var endCursorFunctionName = i;
  //       if (!goOn) {
  //         goOn = true;
  //         while (i > 0 && goOn) {
  //           o = lineCursor.substring(i - 1, i);
  //           if (o.match("^[a-zA-Z_]+$")) {
  //             i--;
  //           } else {
  //             goOn = false;
  //           }
  //         }
  //       }
  //       var functionName = lineCursor.substring(i, endCursorFunctionName);
  //       var functions = fManager.getFunctions();
  //       var parsedFunction = functions[functionName];
  //       if (parsedFunction !== undefined) {
  //         parsedFunction[0].params.out.forEach(function (param) {
  //           allSuggestions.push({"text": param.name, "type": param.type, "rightLabel": param.argmode, "leftLabel": "property"});
  //         });
  //       }
  //     }
  //     return allSuggestions;
  //   }
  //
  //   if (prefix.length < 2){
  //       return;
  //   }
  //   // TODO: Please make a refactor
  //   var checkFunctions = false;
  //   if (this.lastPrefix == prefix) {
  //     if (activatedManually !== undefined) {
  //       this.activatedManuallyCount++;
  //       if (this.activatedManuallyCount % 2 !== 0) {
  //         this.activeSuggestion = suggestionPanes.FUNCTIONS;
  //       } else {
  //         this.activeSuggestion = suggestionPanes.VARIABLES;
  //       }
  //     }
  //   } else {
  //     if (prefix.indexOf(this.lastPrefix) === -1) {
  //       if (this.lastPrefix.indexOf(prefix) === -1) {
  //         // Case new string
  //         if (prefix.length > 1) {
  //           this.activeSuggestion = suggestionPanes.VARIABLES;
  //         }
  //         this.activatedManuallyCount = 0;
  //       }
  //     }
  //   }
  //   this.lastPrefix = prefix;
  //
  //   var checkVariables = this.activeSuggestion === suggestionPanes.VARIABLES && prefix.length > 1;
  //   var checkTokens = this.activeSuggestion === suggestionPanes.VARIABLES && prefix.length > 2;
  //
  //   //Must get the prev word and evaluate if it is (FROM or .)
  //
  //   var match = undefined;
  //
  //   var fileContent = atom.workspace.getActiveTextEditor().getText();
  //   if (fileContent !== null) {
  //     fileManager.loadCurrentFile(fileContent);
  //   }
  //   // Variables
  //   if (this.activeSuggestion === suggestionPanes.VARIABLES) {
  //     var variables = fileManager.getVariables();
  //     var result = _.keys(variables);
  //     var results = fuzzy.filter(prefix, result);
  //     var matches = results.map(function(el) {
  //       return el.string;
  //     });
  //     _.forEach(matches, function (value) {
  //       var variable = variables[value];
  //       var variableType = variable.type;
  //       var argmode = variable.argmode;
  //       var suggestionType = variable.isParam ? "property" : "variable";
  //       allSuggestions.push({"text":value, "type": suggestionType, "leftLabel":variableType, "rightLabel": argmode});
  //     });
  //   }
  //
  //   // Tokens
  //   if (this.activeSuggestion === suggestionPanes.VARIABLES) {
  //     var tokens = fileManager.getTokens();
  //     var results = fuzzy.filter(prefix, tokens);
  //     var matches = results.map(function(el) {
  //       return el.string;
  //     });
  //     _.forEach(matches, function (value) {
  //       if (prefix != value) {
  //         allSuggestions.push({"text":value});
  //       }
  //     });
  //   }
  //
  //   // Functions
  //   if (this.activeSuggestion === suggestionPanes.FUNCTIONS) {
  //     var functions = fManager.getFunctions();
  //     var result = _.keys(functions);
  //     var results = fuzzy.filter(prefix, result);
  //     var matches = results.map(function(el) {
  //       return el.string;
  //     });
  //     _.forEach(matches, function (value) {
  //       match = functions[value][0];
  //       var snippet = PgProvider.createSnippet(value, match.params.in);
  //       allSuggestions.push({"text":value, "type":"function", "leftLabel":match.returnType, "snippet":snippet});
  //     });
  //   }
  //   return allSuggestions;
  // }
