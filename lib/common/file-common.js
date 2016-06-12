'use babel';

var fs = require('fs');

function getLine(editor, bufferPosition) {
  return editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
}

function fileMustBeProcess(filePath) {
  var directoriesConfig = atom.config.get('pg-dev.autocompleteDirectories');
  var directories = directoriesConfig.split(',');
  var directoriesConfig = atom.config.get('pg-dev.autocompleteExtension');
  var extensions = directoriesConfig.split(',');
  var pathArray = filePath.split("/");
  var intersectionArray = _.intersection(pathArray, directories);
  var extension = filePath.substr(filePath.lastIndexOf('.') + 1);
  var validExtension = _.indexOf(extensions, extension) !== -1;
  return intersectionArray.length > 0 && validExtension;
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

function getFileNameByPath(path) {
  var filePathArray = path.split('/');
  var fileName = filePathArray[filePathArray.length - 1].split('.')[0];
  return fileName;
}

export default {
  getLine:getLine,
  fileMustBeProcess:fileMustBeProcess,
  getFiles:getFiles,
  getFileNameByPath: getFileNameByPath
}
