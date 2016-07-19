'use babel';
var fManager = require('./function-manager');
var path = require('path');
var fileManager = require('./file-manager');
var parser = require('./parser');
var _ = require('lodash');

function get() {

}

function linterUnusedVariables(textEditor) {
  linterRet = [];
  unusedVariables = fileManager.checkUnusedVariable();
  _.forEach(unusedVariables, function (value) {
    var regStr = '\\s'+value+'[\\s+=]';
    var range = [[0, 0], [20, 20]];
    textEditor.scanInBufferRange(new RegExp(regStr, 'g'), range, function (iterator) {
      linterRet.push({type: 'Warning', text: 'Unused Variable', range: iterator.range, filePath: fPath});
    });
  });
  return linterRet;
}

function linterUnDeclaredVariables(textEditor) {
  linterRet = [];
  usedVariables = fileManager.getUsedVariables();
  var usedVariablesName = _.keys(usedVariables);
  variables = fileManager.getVariables();
  var variablesName = _.keys(variables);
  var undeclaredVariables = _.difference(usedVariablesName, variablesName);
  _.forEach(undeclaredVariables, function (value) {
    var regStr = '\\s'+value+'[\\s+=;]';
    var range = [[0, 0], [20, 20]];
    textEditor.scanInBufferRange(new RegExp(regStr, 'g'), range, function (iterator) {
      linterRet.push({type: 'Error', text: 'Undeclared Variable', range: iterator.range, filePath: fPath});
    });
  });
  return linterRet;
}

function linterCallFunction(textEditor) {
  var linterRet = [];
  var functions = fManager.getFunctions();
  var functionsKey = _.keys(functions);
  var usedFunctions = fileManager.getUsedFunctions();
  var usedFunctionsKey = _.keys(usedFunctions);
  var inexistentFunctions = _.difference(usedFunctionsKey, functionsKey);
  _.forEach(inexistentFunctions, function (value) {
    var regStr = value + '\\(';
    var range = [[0, 0], [20, 20]];
    textEditor.scanInBufferRange(new RegExp(regStr, 'g'), range, function (iterator) {
      linterRet.push({type: 'Error', text: 'Inexistent Function', range: iterator.range, filePath: fPath});
    });
  });
  return linterRet;
}

function getProvider() {
  const provider = {
    name: 'pg-dev',
    grammarScopes: ['source.pgsql'],
    scope: 'file',
    lintOnFly: true,
    lint: function(textEditor) {
      fPath = textEditor.getPath();
      text = textEditor.getText();
      fileManager.loadCurrentFile(text);
      return new Promise(function(resolve, reject) {
        allLinterRet = [];
        unusedVariablesLinter = linterUnusedVariables(textEditor);
        usedUnDeclaredVariablesLinter = linterUnDeclaredVariables(textEditor);
        calledFunctions = linterCallFunction(textEditor);
        allLinterRet = _.concat([], unusedVariablesLinter, usedUnDeclaredVariablesLinter, calledFunctions);
        resolve(allLinterRet);
      });
    }
  }
  return provider;
}

export default {
  getProvider: getProvider
}
