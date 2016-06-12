'use babel';

var fManager = require('./function-manager');

function getSuggestion() {
  return {
    getSuggestionForWord(textEditor: TextEditor, text: string, range: Range): HyperclickSuggestion {
      var functions = fManager.getFunctions();
      var functionName = undefined;
      if (functions[text] != undefined) {
        functionName = text;
      } else {
        return null;
      }
      ret = {range, callback(){
        if (functionName != undefined) {
          //TODO: Suggest a list of functions in case there are more than one match
          var filePath = functions[text][0].path;
          atom.workspace.open(filePath);
        }
      }};
      return ret;
    }
  }
}

export default {
  getSuggestion: getSuggestion
}
