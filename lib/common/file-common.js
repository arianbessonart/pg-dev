'use babel';

var fs = require('fs');
var _ = require('lodash');

function getLine(editor, bufferPosition) {
  return editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
}

function getEntireLine(editor, bufferPosition) {
  return editor.lineTextForBufferRow(bufferPosition.row);
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
  var list = fs.readdirSync(dir);
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

function appendToFile(path, content) {
  fs.appendFile(path, content, function (err) { });
}

function writeFile(path, content) {
  fs.writeFile(path, content, 'utf8', function (err) { });
}

function readFile(path, callBack) {
  fs.readFile(path, 'utf8', function (err, fileContent){
    return callBack(null, fileContent);
  });
}

function realPath(filePath) {
  return fs.realpathSync(filePath);
}

export default {
  getLine:getLine,
  getEntireLine: getEntireLine,
  fileMustBeProcess:fileMustBeProcess,
  getFiles:getFiles,
  getFileNameByPath: getFileNameByPath,
  appendToFile: appendToFile,
  writeFile: writeFile,
  readFile: readFile,
  realPath: realPath
}
