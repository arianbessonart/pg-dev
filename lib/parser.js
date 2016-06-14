'use babel'

var _ = require('lodash');
var fCommon = require('./common/file-common')
var dropSqlPrefix = 'DROP FUNCTION IF EXISTS';
var alterSqlPrefix = 'ALTER FUNCTION';

function parseFunction(fileContent) {
  parseFunctionRegex = /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\.([^(]*)([(\s+\w+,)='\[\]]*)\s+RETURNS\s+([(\s+\w+,)=\[\]]*)\s+AS/i;
  var matches = fileContent.match(parseFunctionRegex);
  var functionData = undefined;
  if (matches !== null) {
    var parsedParameters = parseParameters(matches[4]);
    functionData = {
      schema: matches[2],
      name: matches[3],
      params: parsedParameters,
      returnType: matches[5],
      content: fileContent,
      drop: createDropFunction(matches[2], matches[3], matches[4]),
      alter: createAlterFunction(matches[2], matches[3], matches[4])
    };
  }
  return functionData;
}

function createDropFunction(schema, functionName, params) {
  params = buildAlterDropParams(params, functionName);
  var dropSql = dropSqlPrefix + ' ' + schema + '.' + functionName + params + ';';
  return dropSql;
}

function createAlterFunction(schema, functionName, params) {
  params = buildAlterDropParams(params);
  var alterSql = alterSqlPrefix + ' ' + schema + '.' + functionName + params;
  return alterSql;
}

function buildAlterDropParams(params) {
  var paramsStr = '';
  params = params.trim().replace(/\)$/, '').replace(/^\(/, '');
  var parameters = params.split(',');
  var paramsTypes = [];
  parameters.forEach(function (value) {
    if (value != null && value.length > 0) {
      var param = parseParameter(value);
      if (param.argmode !== 'OUT') {
        paramsTypes.push(param.type);
      }
    }
  });
  return '(' + paramsTypes.join(', ').trim() + ')';
}

function parseParameters(paramsIn) {
  var params = {"in":{}, "out":{}};
  paramsIn = paramsIn.trim().replace(/\)$/, '').replace(/^\(/, '');
  var parameters = paramsIn.split(',');
  parameters.forEach(function (value) {
    if (value != null && value.length > 0) {
      var param = parseParameter(value);
      if (param.argmode.toUpperCase().indexOf("IN") != -1) {
        params['in'][name] = {"name": param.name, "type": param.type, "argmode": param.argmode, "default": param.isDefault};
      }
      if (param.argmode.toUpperCase().indexOf("OUT") != -1) {
        params['out'][name] = {"name": param.name, "type": param.type, "argmode": param.argmode, "default": param.isDefault};
      }
    }
  });
  return params;
}

function parseParameter(param) {
  var re = /\s*(INOUT|IN|OUT)?\s*(\w+)\s*([^=]*)\s*(.*)/i;
  var matches = param.match(re);
  var argmode = matches[1] == undefined ? 'IN' : matches[1].toUpperCase();
  var name = matches[2];
  var type = matches[3];
  var isDefault = matches[4] != '';
  return {"argmode": argmode, "name": name, "type": type, "isDefault": isDefault};
}

function reverse(s) {
  var i = s.length,
      o = '';
  while (i > 0) {
    o += s.substring(i - 1, i);
    i--;
  }
  return o;
}

function getFunctionNameOnDot(line) {
  var functionName = '';
  var i = line.length;
  var o = '';
  var goOn = true;
  var closeParenthesisCount = 0;
  while (i > 0 && goOn) {
    o = line.substring(i - 1, i);
    if (o === ')') {
      closeParenthesisCount++;
    } else if (o === '(') {
      goOn = false;
      i++;
    }
    i--;
  }
  if (!goOn) {
    goOn = true;
    while (i > 0 && goOn) {
      o = line.substring(i - 1, i);
      if (o === '(') {
        closeParenthesisCount--;
      }
      if (closeParenthesisCount === 1) {
        goOn = false;
      }
      i--;
    }
    var endCursorFunctionName = i;
    if (!goOn) {
      goOn = true;
      while (i > 0 && goOn) {
        o = line.substring(i - 1, i);
        if (o.match("^[a-zA-Z_]+$")) {
          i--;
        } else {
          goOn = false;
        }
      }
    }
    if (!goOn) {
      functionName = line.substring(i, endCursorFunctionName);
    }
    return functionName;
  }
}

function isDotSuggestion(line) {
  var ret = false;
  var goOn = true;
  var i = line.length;
  var o = '';
  while (i > 0 && goOn) {
    o = line.substring(i - 1, i);
    if (o === ' ') {
      goOn = false;
    } else if (o === '.') {
      goOn = false;
      ret = true;
    }
    i--;
  }
  return ret;
}

function getWordByPosition(line, position) {
  var ret = '';
  var goOn = true;
  var i = line.length;
  var o = '';
  while (i > 0 && goOn) {
    o = line.substring(i - 1, i);
    if (o.match("^[a-zA-Z_]+$")) {
      ret += o;
      i--;
    } else {
      goOn = false;
    }
  }
  return reverse(ret);
}

function getPrevWordByPosition(line, position) {
  var ret = '';
  var i = line.length;
  for (var iter = 0; iter < 2; iter++) {
    ret = '';
    var o = '';
    var goOn = true;
    while (i > 0 && goOn) {
      o = line.substring(i - 1, i);
      if (o.match("^[a-zA-Z_]+$")) {
        ret += o;
      } else {
        goOn = false;
      }
      i--;
    }
  }
  return reverse(ret);
}

function getFunctionContent(fileContent) {
  var functionContent = fileContent.substring(fileContent.indexOf('BEGIN') + 5, fileContent.lastIndexOf('END'));
  return functionContent;
}

export default {
  parseFunction: parseFunction,
  getFunctionNameOnDot: getFunctionNameOnDot,
  isDotSuggestion: isDotSuggestion,
  getWordByPosition: getWordByPosition,
  getPrevWordByPosition: getPrevWordByPosition,
  getFunctionContent: getFunctionContent
}
