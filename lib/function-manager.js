'use babel';

var _ = require('lodash');
var fs = require('fs');
var parser = require('./parser');
var fCommon = require('./common/file-common');
var functions = {};

function loadFunctions(basePath, callBack) {
  var filesPath = fCommon.getFiles(basePath);
  _.map(filesPath, (filePath, index) => {
    fs.readFile(filePath, 'utf8', function (err, fileContent){
      functionData = parser.parseFunction(fileContent);
      if (functionData !== undefined) {
        functionData['path'] = filePath;
        if (functions[functionData.name] === undefined) {
          functions[functionData.name] = [];
        }
        functions[functionData.name].push(functionData);
      }
      if (index === filesPath.length - 1) {
        return callBack(functions);
      }
    });
  });
}

function addFunction(filePath, callBack) {
  fs.readFile(filePath, 'utf8', function (err, fileContent){
    var functionData = parser.parseFunction(fileContent);
    if (functionData !== undefined) {
      functionData['path'] = filePath;
      if (functions[functionData.name] === undefined) {
        functions[functionData.name] = [];
      }
      functions[functionData.name].push(functionData);
      return callBack(null, null);
    }
  });
}

function updateFunction(filePath, callBack) {
  removeFunction(filePath);
  addFunction(filePath, function(err, result) {
    return callBack(err, result);
  });
}

function removeFunction(filePath) {
  var f = getFunctionByFilePath(filePath);
  if (f !== undefined) {
    if (functions[f.name] !== undefined) {
      _.remove(functions[f.name], {
        path: filePath
      });
      if (functions[f.name].length === 0) {
        delete functions[f.name];
      }
    }
  }
}

function getFunctionByFilePath(filePath) {
  var ret = undefined;
  var fileName = fCommon.getFileNameByPath(filePath);
  var funs = functions[fileName];
  if (funs !== undefined) {
    var index = _.findIndex(funs, function(o) {
      return o.path === filePath;
    });
    if (index !== -1) {
      ret = funs[index];
    }
  } else {
    _.forEach(functions, function (value, key) {
      var index = _.findIndex(value, function(o) {
        return o.path === filePath;
      });
      if (index !== -1) {
        ret = functions[key][index];
      }
    });
  }
  return ret;
}

function getFunctions() {
  return functions;
}

function checkRules(path) {
  var ret = undefined;
  var fun = getFunctionByFilePath(path);
  var fileName = fCommon.getFileNameByPath(path);
  if (fileName !== fun.name) {
    return {"level": "error", "message": "The filename must be equal than function name. path: " + path}
  }
  if (fileName.length > 64) {
    return {"level": "error", "message": "The function name can not be longer than 64 characters. path: " + path}
  }
  return ret;
}

function getOutParams(fun) {
  var outParams = '';
  _.forEach(fun.params.out, function (value, key) {
    outParams += key + ', ';
  });
  outParams = outParams.trim().replace(/\,$/, '');
  return outParams;
}

export default {
  loadFunctions: loadFunctions,
  getFunctions: getFunctions,
  addFunction: addFunction,
  removeFunction: removeFunction,
  updateFunction: updateFunction,
  getFunctionByFilePath: getFunctionByFilePath,
  checkRules: checkRules,
  getOutParams: getOutParams
}
