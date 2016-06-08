'use babel';


var Parser = require('./parser/parser');
var variables = {};
var tokens = [];

export default {

  loadCurrentFile(fileContent) {
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
        var rest = match.substring(variableName.length);
        var variableType = rest.split('=')[0];
        variables[variableName] = variableType;
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
  },

  getVariables() {
    return variables;
  },

  getTokens() {
    return tokens;
  },


}
