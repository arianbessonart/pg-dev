'use babel';


var _ = require('lodash');
var parser = require('./parser');
var variables = {};
var tokens = [];
var currentContent = '';

export default {

  loadCurrentFile(fileContent) {
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
  },

  getVariables() {
    return variables;
  },

  getTokens() {
    return tokens;
  },

  checkUnusedVariable() {
    var unusedVariables = [];
    _.forEach(variables, function (value, key) {
      if (key.length > 0) {
        var index = _.indexOf(tokens, key);
        if (index === -1) {
          unusedVariables.push(key);
        }
      }
    });
    return unusedVariables;
  },


}
