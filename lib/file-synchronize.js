"use babel";

var chokidar = require('chokidar');
var fCommon = require('./common/file-common')
var fManager = require('./function-manager');
var fileManager = require('./file-manager');

function init(basePath) {
  watcher = chokidar.watch(basePath, {ignored: /^\./, persistent: true});
  watcher
  .on('add', function (path, stats) {
    if (fCommon.fileMustBeProcess(path)) {
      fManager.addFunction(path, function (err, result) {
        if ((check = fManager.checkRules(path)) !== undefined) {
          showNotification(check.level, check.message);
        }
        console.log('Add file: ' + path);
      });
    }
  })
  .on('change', function (path, stats) {
    if (fCommon.fileMustBeProcess(path)) {
      fManager.updateFunction(path, function (err, result) {
        if (err !== null) {
          
        }
        if ((check = fManager.checkRules(path)) !== undefined) {
          showNotification(check.level, check.message);
        }
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
