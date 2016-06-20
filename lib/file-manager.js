'use babel';

var fCommon = require('./common/file-common')
var _ = require('lodash');
var parser = require('./parser');
var variables = {};
var tokens = [];
var currentContent = '';
var fManager = require('./function-manager');


function loadCurrentFile(fileContent) {
  currentContent = fileContent;
  variables = {};
  tokens = [];
  var declareStr = 'DECLARE';
  if (fileContent.indexOf(declareStr) !== -1) {
    fileContent.replace('declare', declareStr);
    fileContent.replace('begin', 'BEGIN');
    var matches = fileContent.substring(fileContent.indexOf(declareStr) + declareStr.length, fileContent.indexOf('BEGIN')).split(';');
    matches.forEach(function (value) {
      var match = value.trim();
      var variableArray = match.split(' ');
      var variableName = variableArray[0];
      var rest = match.substring(variableName.length).replace(':=', '=');
      var variableType = rest.split('=')[0];
      variables[variableName] = {"type": variableType, "argmode": "local"};
    });
  }
  var regex = /\w+/g;
  var match = fileContent.match(regex);
  for (var i = 0; i < match.length; i++) {
    var token = match[i];
    if (variables[token] === undefined) {
      tokens.push(token);
    }
  }
  var parsedFunction = parser.parseFunction(fileContent);
  if (parsedFunction !== undefined) {
    _.forEach(parsedFunction.params.in, function (value, key) {
      variables[value.name] = {"type": value.type, "argmode": value.argmode, "isParam": "true"};
    });
    _.forEach(parsedFunction.params.out, function (value, key) {
      variables[value.name] = {"type": value.type, "argmode": value.argmode, "isParam": "true"};
    });
  }
}

function getVariables() {
  return variables;
}

function getTokens() {
  return tokens;
}

function tokenize(content) {
  var regex = /\w+/g;
  var tokenizes = content.match(regex);
  return tokenizes;
}

function checkUnusedVariable() {
  var functionContent = parser.getFunctionContent(currentContent);
  var tokensFunctionContent = tokenize(functionContent);
  var unusedVariables = [];
  _.forEach(variables, function (value, key) {
    if (key.length > 0) {
      var index = _.indexOf(tokensFunctionContent, key);
      if (index === -1) {
        unusedVariables.push(key);
      }
    }
  });
  return unusedVariables;
}

function addSuffix(path, fileContent, suffix) {
  var alterFunctionMatch = fileContent.match(/ALTER\s+FUNCTION([\s\S]*?)\;/);
  if (alterFunctionMatch !== null) {
    if (alterFunctionMatch[0] !== suffix) {
      var alterFunctionMatch = fileContent.replace(/ALTER\s+FUNCTION([\s\S]*?)\;/g,suffix);
      fCommon.writeFile(path, alterFunctionMatch);
    }
  } else {
    fCommon.appendToFile(path, suffix);
  }
}

function normalizeSignature(path, fileContent) {
  var fileContent  = fileContent.replace(/CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\.([^(]*)([(\s+\w+,)='\[\]]*)\s+RETURNS/ig, 'CREATE $1FUNCTION $2.$3$4RETURNS');
  fileContent  = fileContent.replace(/\s+DEFAULT\s+/ig, ' = ');
  fileContent = fileContent.replace(/\s\s+/g, ' ');
  atom.workspace.getActiveTextEditor().setText(fileContent);
}

function generateSelect(editor, bufferPosition) {
  var currentWord = editor.getWordUnderCursor();
  if (currentWord !== undefined && currentWord.length > 0) {
    functions = fManager.getFunctions();
    if (functions[currentWord] !== undefined && functions[currentWord].length > 0) {
      var fun = functions[currentWord][0];
      var currentCursor = editor.cursors[0];
      var previousWordBp = currentCursor.getPreviousWordBoundaryBufferPosition();
      var insertToEnd = null;
      var moveToTheEnd = false;
      if (fun.returnType === 'void') {
        generateSql = 'PERFORM ';
        editor.getBuffer().insert(previousWordBp, generateSql);
        insertToEnd = ';';
        moveToTheEnd = true;
      } else if (fun.returnType === 'record') {
        outParams = fManager.getOutParams(fun);
        generateSql = 'SELECT ' + outParams + ' FROM ';
        editor.getBuffer().insert(previousWordBp, generateSql);
        insertToEnd = ' INTO ';
        moveToTheEnd = true;
      } else {
        generateSql = ' = ';
        editor.getBuffer().insert(previousWordBp, generateSql);
        insertToEnd = ';';
      }
      if (insertToEnd !== null) {
        currentCursor.moveToEndOfLine();
        var endOfLineBp = currentCursor.getBufferPosition();
        editor.getBuffer().insert(endOfLineBp, insertToEnd);
      }
      if (moveToTheEnd) {
        currentCursor.moveToEndOfLine();
      } else {
        currentCursor.setBufferPosition(previousWordBp);
      }
    }
  }
}

function clean() {
  variables = {};
  tokens = [];
  currentContent = '';
}


export default {
  loadCurrentFile: loadCurrentFile,
  getVariables: getVariables,
  getTokens: getTokens,
  checkUnusedVariable: checkUnusedVariable,
  addSuffix: addSuffix,
  normalizeSignature: normalizeSignature,
  generateSelect: generateSelect,
  clean: clean
}
