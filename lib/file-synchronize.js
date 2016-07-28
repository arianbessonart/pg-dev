"use babel";

var chokidar = require('chokidar');
var fCommon = require('./common/file-common')
var fManager = require('./function-manager');
var fileManager = require('./file-manager');
var path = require('path');
var dataDb = require('./db/data.json');
var watcher;

function updateFile(uFile) {
  editor = atom.workspace.getActivePaneItem();
  if (editor !== undefined) {
    if (editor.buffer !== undefined) {
      var bfPosition = editor.getCursorBufferPosition();
      var realPathUFile = fCommon.realPath(uFile);
      if (editor.buffer.file.path) {        
        filePathCurrent = editor.buffer.file.path;
        if (realPathUFile === filePathCurrent) {
          var fun = fManager.getFunctionByFilePath(uFile);
          if(fun.content){
            fileManager.loadCurrentFile(fun.content);
            if ((check = fManager.checkRules(uFile)) !== undefined) {
              showNotification(check.level, check.message);
            }
            normalizeContent(editor, fun);
            editor.setCursorBufferPosition(bfPosition);
          }
        }
      }
    }
  }
}

function normalizeContent(editor, fun) {
  var addAlterToTheEndsOfTheFunction = atom.config.get('pg-dev.addAlterToTheEndsOfTheFunction');
  if (addAlterToTheEndsOfTheFunction) {
    var ownerFunction = atom.config.get('pg-dev.ownerFunction');
    suffix = fun.alter + '\n' + 'OWNER TO ' + ownerFunction + ';';
    addAlterFunction(editor, suffix);
  }
  var firstText = editor.getBuffer().getText();
  var currentText = editor.getBuffer().getText();
  var replaceMultiplesWhitespace = atom.config.get('pg-dev.replaceMultiplesWhitespace');
  if (replaceMultiplesWhitespace) {
    currentText = currentText.replace(/(\w+|\=|\,)  +/g, '$1 ');
  }
  var normalizeWhitespace = atom.config.get('pg-dev.normalizeWhitespace');
  if (normalizeWhitespace) {
    currentText = currentText.replace(/(\w+|\')\s*\=\s*(\w+|\d+|\'|\()/g, '$1 = $2');
    currentText = currentText.replace(/(\w+|\d+|\')\s*\,\s*(\w+|\d+|\'|\()/g, '$1, $2');
    currentText = currentText.replace(/\(\s*(\w+|\')/g, '($1');
    // currentText = currentText.replace(/(\w+)\s+\(/g, '$1(');
  }
  var convertKeywordsUpperCase = atom.config.get('pg-dev.convertKeywordsUpperCase');
  if (convertKeywordsUpperCase) {
    var keywordsUpperCase = dataDb.keywords;
    keywordsUpperCase.forEach(function (keyword) {
      regStr = '(\\s+)('+keyword+')(\\s|\\()';
      replaceStr = '$1'+keyword.toUpperCase()+'$3';
      currentText = currentText.replace(new RegExp(regStr, 'g'), replaceStr);
      regStr = '^('+keyword+')(\\s|\\()';
      replaceStr = keyword.toUpperCase()+'$2';
      currentText = currentText.replace(new RegExp(regStr, 'g'), replaceStr);
    });
  }
  if (firstText !== currentText) {
    editor.getBuffer().setText(currentText);
  }
}

function addAlterFunction(editor, suffix) {
  var currentText = editor.getBuffer().getText();
  var alterFunctionMatch = currentText.match(/ALTER\s+FUNCTION([\s\S]*?)\;/i);
  if (alterFunctionMatch !== null) {
    if (alterFunctionMatch[0] !== suffix) {
      currentText = currentText.replace(/ALTER\s+FUNCTION([\s\S]*?)\;/ig, suffix);
      editor.getBuffer().setText(currentText);
    }
  } else {
    currentText += suffix;
    editor.getBuffer().setText(currentText);
  }

}

function init(basePath) {
  watcher = chokidar.watch(basePath, {ignored: /^\./, persistent: true});
  watcher
  .on('add', function (path, stats) {
    if (fCommon.fileMustBeProcess(path)) {
      fManager.addFunction(path, function (err, result) {
        if ((check = fManager.checkRules(path)) !== undefined) {
          showNotification(check.level, check.message);
        }
      });
    }
  })
  .on('change', function (path, stats) {
    if (fCommon.fileMustBeProcess(path)) {
      fManager.updateFunction(path, function (err, result) {
        updateFile(path);
      });
    }
  })
  .on('unlink', function (path, stats) {
    if (fCommon.fileMustBeProcess(path)) {
      fManager.removeFunction(path);
    }
  })
  .on('error', function (error) {
    console.log('Error happened', error);
  });
}

function stopWatch() {
  if (watcher !== null) {
    watcher.close();
  }
  fileManager.clean();
  fManager.clean();
}

function showNotification(level, message) {
  switch (level) {
    case 'error':
      atom.notifications.addError(message);
      break;
    case 'warning':
      atom.notifications.addWarning(message);
      break;
    case 'success':
      atom.notifications.addSuccess(message);
      break;
    default:
      atom.notifications.addInfo(message);
  }
}

export default {
  init:init,
  stopWatch: stopWatch
}
