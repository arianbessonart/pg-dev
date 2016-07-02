"use babel";

var chokidar = require('chokidar');
var fCommon = require('./common/file-common')
var fManager = require('./function-manager');
var fileManager = require('./file-manager');
var path = require('path');
var watcher;

function updateFile(uFile) {
  editor = atom.workspace.getActivePaneItem();
  if (editor !== undefined) {
    if (editor.buffer !== undefined) {
      var realPathUFile = fCommon.realPath(uFile);
      filePathCurrent = editor.buffer.file.path;
      if (realPathUFile === filePathCurrent) {
        var fun = fManager.getFunctionByFilePath(uFile);
        fileManager.loadCurrentFile(fun.content);
        var alertOnUnusedVariables = atom.config.get('pg-dev.alertOnUnusedVariables');
        if (alertOnUnusedVariables && (unusedVariables = fileManager.checkUnusedVariable()).length > 0) {
          showNotification('info', 'Unused Variables: ' + unusedVariables.join(', '));
        }
        if ((check = fManager.checkRules(uFile)) !== undefined) {
          showNotification(check.level, check.message);
        }
        var addAlterToTheEndsOfTheFunction = atom.config.get('pg-dev.addAlterToTheEndsOfTheFunction');
        if (addAlterToTheEndsOfTheFunction) {
          var ownerFunction = atom.config.get('pg-dev.ownerFunction');
          suffix = fun.alter + '\n' + 'OWNER TO ' + ownerFunction + ';';
          addAlterFunction(editor, suffix);
        }
      }
    }
  }
}

function addAlterFunction(editor, suffix) {
  var currentText = editor.getBuffer().getText();
  var alterFunctionMatch = currentText.match(/ALTER\s+FUNCTION([\s\S]*?)\;/);
  if (alterFunctionMatch !== null) {
    if (alterFunctionMatch[0] !== suffix) {
      currentText = currentText.replace(/ALTER\s+FUNCTION([\s\S]*?)\;/g, suffix);
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
