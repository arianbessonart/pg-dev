'use babel';


var Parser = require('./parser/parser');
var variables = {"m_name":"text", "m_event_type_id": "integer"};

export default {

  getVariables() {
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
        console.log(variableType);
      }
    }
    return variables;
  },

}
