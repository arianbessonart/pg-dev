'use babel'

var fs = require('fs');
var _ = require('lodash');

function parseFunctions(basePath, callBack) {
  functions = {};
  var filesPath = getFiles(basePath);
  _.map(filesPath, (filePath, index) => {
    fs.readFile(filePath, 'utf8', function (err, fileContent){
      functionData = parseFunction(fileContent);
      if (functionData !== undefined) {
        functionData['path'] = filePath;
        functionData['content'] = fileContent;
        if (functions[functionData.functionName] === undefined) {
          functions[functionData.functionName] = [];
        }
        functions[functionData.functionName].push(functionData);
      }
      if (index === filesPath.length - 1) {
        return callBack(functions);
      }
    });
  });
}


function parseFunction(fileContent) {
  parseFunctionRegex = /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\.([^(]*)([(\s+\w+,)='\[\]]*)\s+RETURNS\s+([(\s+\w+,)=\[\]]*)\s+AS/i;
  var matches = fileContent.match(parseFunctionRegex);
  var functionData = undefined;
  if (matches !== null) {
    functionData = {
      schema: matches[2],
      functionName: matches[3],
      params: parseParameters(matches[4]),
      returnType: matches[5]
    };
  }
  return functionData;
}

function parseParameters(paramsIn) {
  var params = {"in":{}, "out":{}};
  var re = /\s*(INOUT|IN|OUT)?\s*(\w+)\s*(\w+)\s*([^,]*)/i;
  paramsIn = paramsIn.trim().replace(/\)$/, '').replace(/^\(/, '');
  var parameters = paramsIn.split(',');
  parameters.forEach(function (value) {
    if (value != null && value.length > 0) {
      var matches = value.match(re);
      var argmode = matches[1] == undefined ? 'IN' : matches[1];
      var name = matches[2];
      var type = matches[3];
      var hasDefault = matches[4] != '';
      if (argmode.toUpperCase().indexOf("IN") != -1) {
        params['in'][name] = {"name": name, "type": type, "argmode": argmode, "default": hasDefault};
      }
      if (argmode.toUpperCase().indexOf("OUT") != -1) {
        params['out'][name] = {"name": name, "type": type, "argmode": argmode, "default": hasDefault};
      }
    }
  });
  return params;
}


function getFiles(dir) {
  var results = [];
  var list = fs.readdirSync(dir)
  list.forEach(function (file) {
    file = dir + '/' + file
    var stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file))
    } else if (fileMustBeProcess(file)) {
      results.push(file);
    }
  });
  return results;
}

function fileMustBeProcess(filePath) {
  var directories = ['functions'];
  var extensions = ['sql'];
  var pathArray = filePath.split("/");
  var intersectionArray = _.intersection(pathArray, directories);
  var extension = filePath.substr(filePath.lastIndexOf('.') + 1);
  var validExtension = _.indexOf(extensions, extension) !== -1;
  return intersectionArray.length > 0 && validExtension;
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

export default {
  parseFunction: parseFunction,
  parseFunctions: parseFunctions,
  getFunctionNameOnDot: getFunctionNameOnDot,
  isDotSuggestion: isDotSuggestion,
  getWordByPosition: getWordByPosition,
  getPrevWordByPosition: getPrevWordByPosition
}
