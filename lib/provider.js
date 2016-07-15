'use babel';

var fuzzy = require('fuzzy');
var _ = require('lodash');
var fManager = require('./function-manager');
var fileManager = require('./file-manager');
var fileUtil = require('./common/file-common');
var parser = require('./parser');
var dataDb = require('./db/data.json');

var suggestionPanes = { NONE: 0, VARIABLES: 1, FUNCTIONS: 2, DOT: 3, DATA_TYPES: 4};


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


function init() {
  this.selector = '.source.sql, .source.pgsql';
  this.disableForSelector = '.source.sql .comment, .source.pgsql .comment';
  this.excludeLowerPriority = true;
  this.inclusionPriority = 1;
  this.lastPrefix = "";
  this.lastRow = 0;
  this.activatedManuallyCount = 0;
  this.activeSuggestion = suggestionPanes.NONE;
}

function suggestVariables(prefix) {
  var suggestions = [];
  var variables = fileManager.getVariables();
  var result = _.keys(variables);
  var matches = fuzzyMatch(prefix, result);
  _.forEach(matches, function (value) {
    if (value !== prefix) {
      var variable = variables[value];
      var variableType = variable.type;
      var argmode = variable.argmode;
      var suggestionType = variable.isParam ? "property" : "variable";
      suggestions.push({"text":value, "type": suggestionType, "leftLabel":variableType, "rightLabel": argmode});
    }
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
    if (functions[value].length > 0) {
      match = functions[value][0];
      var snippet = createSnippet(value, match.params.in);
      suggestions.push({"text":value, "type":"function", "leftLabel":match.returnType, "snippet":snippet});
    }
  });
  return suggestions;
}

function suggestDataTypes(prefix) {
  var suggestions = [];
  if (prefix !== undefined) {
    var dataTypes = _.keys(dataDb.dataTypes);
    var matches = fuzzyMatch(prefix, dataTypes);
    _.forEach(matches, function (value) {
      dt = dataDb.dataTypes[value];
      suggestions.push({"text": value, "type": "type", "description": dt.description, "rightLabel": dt.group, "descriptionMoreURL": dt.descriptionMoreURL});
    });
  } else {
    _.forEach(dataDb.dataTypes, function (value, key) {
      suggestions.push({"text": key, "type": "type", "description": value.description, "rightLabel": value.group, "descriptionMoreURL": value.descriptionMoreURL});
    });
  }
  return suggestions;
}

function suggestDot(line, prefix) {
  var suggestions = [];
  var functionName = parser.getFunctionNameOnDot(line);
  if (functionName !== null) {
    var functions = fManager.getFunctions();
    var parsedFunction = functions[functionName];
    if (parsedFunction !== undefined) {
      var outParams = parsedFunction[0].params.out;
      if (prefix !== undefined) {
        var keys = _.keys(outParams);
        var matches = fuzzyMatch(prefix, keys);
        _.forEach(matches, function (value) {
          var param = outParams[value];
          suggestions.push({"text": param.name, "type": "property", "rightLabel": param.argmode, "leftLabel": param.type});
        });
      } else {
        _.forEach(outParams, function (value, key) {
          suggestions.push({"text": value.name, "type": "property", "rightLabel": value.argmode, "leftLabel": value.type});
        });
      }
    } else {
      var nameBDot = parser.getStringBeforeDot(line);
      if (nameBDot !== null) {
        var variables = fileManager.getVariables();
        var currentVariable = variables[nameBDot];
        if (currentVariable !== undefined && currentVariable.type === 'record' && currentVariable.outParams !== undefined) {
          var outParams = currentVariable.outParams;
          if (prefix !== undefined) {
            var keys = _.keys(outParams);
            var matches = fuzzyMatch(prefix, keys);
            _.forEach(matches, function (value) {
              var param = outParams[value];
              suggestions.push({"text": param.name, "type": "property", "leftLabel": param.type});
            });
          } else {
            _.forEach(outParams, function (param) {
              suggestions.push({"text": param.name, "type": "property", "leftLabel": param.type});
            });
          }
        }
      }

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

function mustSuggestDataTypesOnDeclare(editor, line) {
  var ret = isDeclaringVariables(editor);
  var regex = /[\w=:]+/g;
  var words = line.match(regex);
  if (words !== null) {
    ret = ret && ((words.length === 2 && !editor.getCursors()[0].isSurroundedByWhitespace()) || (words.length === 1 && editor.getCursors()[0].isSurroundedByWhitespace()));
  } else {
    ret = false;
  }
  return ret;
}

function isDeclaringVariables(editor) {
  var ret = false;
  var dPosition = fileManager.getPositionForDeclareVariables(editor.buffer);
  if (dPosition !== null) {
    var currentBp = editor.getCursorBufferPosition();
    ret = dPosition.start < currentBp.row && currentBp.row < dPosition.end;
  }
  return ret;
}

function getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
  var allSuggestions = [];
  var variablesSuggestions = [];
  var tokensSuggestions = [];
  var dataTypeSuggestions = [];
  var functionsSuggestions = [];
  var dotSuggestions = [];
  var line = fileUtil.getLine(editor, bufferPosition);
  var currentWord = editor.getWordUnderCursor();
  var sDataTypes = mustSuggestDataTypesOnDeclare(editor, line);
  var prevWord = parser.getPrevWordByPosition(line, bufferPosition.column);
  var isDotSuggestion = parser.isDotSuggestion(line);
  var isDoubleDotSuggestion = parser.isDoubleDotSuggestion(line);
  if (this.lastRow !== bufferPosition.row) {
    this.activeSuggestion = suggestionPanes.NONE;
  }
  if (prefix === '.') {
    this.activeSuggestion = suggestionPanes.DOT;
    dotSuggestions = suggestDot(line);
  } else if (prefix === ';') {
    this.activeSuggestion = suggestionPanes.NON
  } else if (prefix === '::') {
    this.activeSuggestion = suggestionPanes.DATA_TYPES;
    dataTypeSuggestions = suggestDataTypes();
  } else {
    if (isDotSuggestion) {
      this.activeSuggestion = suggestionPanes.DOT;
    } else if (sDataTypes) {
      this.activeSuggestion = suggestionPanes.DATA_TYPES;
    } else if (isDoubleDotSuggestion) {
      this.activeSuggestion = suggestionPanes.DATA_TYPES;
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
      case suggestionPanes.DATA_TYPES:

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
    } else if (this.activeSuggestion === suggestionPanes.DATA_TYPES) {
      dataTypeSuggestions = suggestDataTypes(prefix);
    }
    this.lastPrefix = prefix;
  }
  this.lastRow = bufferPosition.row;
  allSuggestions = _.concat(variablesSuggestions, tokensSuggestions, functionsSuggestions, dotSuggestions, dataTypeSuggestions);
  return allSuggestions;
}

export default {
    init:init,
    getSuggestions: getSuggestions,
    onDidInsertSuggestion: onDidInsertSuggestion
}
