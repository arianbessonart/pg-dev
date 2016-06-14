"use babel";

var chokidar = require('chokidar');
var fCommon = require('./common/file-common')
var fManager = require('./function-manager');
var fileManager = require('./file-manager');


function updateFile(path) {
  var fun = fManager.getFunctionByFilePath(path);
  fileManager.loadCurrentFile(fun.content);
  var alertOnUnusedVariables = atom.config.get('pg-dev.alertOnUnusedVariables');
  if (alertOnUnusedVariables && (unusedVariables = fileManager.checkUnusedVariable()).length > 0) {
    showNotification('info', 'Unused Variables: ' + unusedVariables.join(', '));
  }
  if ((check = fManager.checkRules(path)) !== undefined) {
    showNotification(check.level, check.message);
  }
  var addTheAlterToTheEndsOfTheFunction = atom.config.get('pg-dev.addTheAlterToTheEndsOfTheFunction');
  if (addTheAlterToTheEndsOfTheFunction) {
    var ownerFunction = atom.config.get('pg-dev.ownerFunction');
    fileManager.addSuffix(path, fun.content, fun.alter + '\n' + 'OWNER TO ' + ownerFunction + ';');
  }
  // fileManager.normalizeSignature(path, fun.content);
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
        // console.log('Add file: ' + path);
      });
    }
  })
  .on('change', function (path, stats) {
    if (fCommon.fileMustBeProcess(path)) {
      fManager.updateFunction(path, function (err, result) {
        updateFile(path);
      });
      console.log('Change file: ' + path);
    }
  })
  .on('unlink', function (path, stats) {
    if (fCommon.fileMustBeProcess(path)) {
      fManager.removeFunction(path);
      console.log('Unlink file: ' + path);
    }
  })
  .on('error', function (error) {
    console.log('Error happened', error);
  });
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
}
