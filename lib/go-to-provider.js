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
  this.editorWatch = atom.workspace.observeActivePaneItem (function (editor) {
      if (editor.getTitle() != 'Settings') {
        if (editor.getFileName().indexOf('.sql') > -1) {
          var editorView = atom_space_pen_views_1.$(atom.views.getView(editor));
          var subscriber = new Subscriber();
          var scroll = getFromShadowDom(editorView, '.scroll-view');
          subscriber.subscribe(scroll, 'click', function (e) {
            var headFunctionName = e.target.innerText;
            console.log(headFunctionName.slice(0, headFunctionName.indexOf("(")).replace('PERFORM','').replace('SELECT','').trim());
            //div1 = document.createElement('div');
            // disposable = atom.tooltips.add(editorView.getElement(), {title: 'This is a tooltip', trigger: 'click', 'html': false});
            // disposable.dispose();
          });
          atom.commands.add('atom-text-editor', 'editor:will-be-removed', function (e) {
              subscriber.unsubscribe();
          });
        } else {
          console.log("No es Sql");
        }
      }
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
