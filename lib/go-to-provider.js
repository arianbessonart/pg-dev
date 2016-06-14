'use babel';

var fManager = require('./function-manager');
var atom_space_pen_views_1 = require("atom-space-pen-views");
var emissary = require('emissary');
var Subscriber = emissary.Subscriber;

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

//TODO: Still learning and coding.
function test() {
  this.editorWatch = atom.workspace.observeTextEditors(function (editor) {
      var editorView = atom_space_pen_views_1.$(atom.views.getView(editor));
      var subscriber = new Subscriber();
      var scroll = getFromShadowDom(editorView, '.scroll-view');
      subscriber.subscribe(scroll, 'keydown', function (e) { console.log("Test On Click"); });
      atom.commands.add('atom-text-editor', 'editor:will-be-removed', function (e) {
          subscriber.unsubscribe();
      });
  });
}

function getFromShadowDom(element, selector) {
    var el = element[0];
    var found = el.rootElement.querySelectorAll(selector);
    return atom_space_pen_views_1.$(found[0]);
}

export default {
  getSuggestion: getSuggestion,
  test: test
}
