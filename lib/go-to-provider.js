'use babel';

var fManager = require('./function-manager');
var atom_space_pen_views_1 = require("atom-space-pen-views");
var emissary = require('emissary');
var path = require('path');
var S = require('string');
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

function getFunctionDefinition() {
  this.editorWatch = atom.workspace.observeActivePaneItem (function (editor) {
      if ((typeof atom.workspace.getActiveTextEditor() != 'undefined') && (atom.workspace.getActivePaneItem().getRootScopeDescriptor().getScopesArray().toString() === 'source.pgsql')) {
        var functionName = '';
        var functions = fManager.getFunctions();
        var editorView = atom_space_pen_views_1.$(atom.views.getView(editor));
        var subscriber = new Subscriber();
        var scroll = getFromShadowDom(editorView, '.scroll-view');

        subscriber.subscribe(scroll, 'click', function (e) {
          getFunctionNameOfList(functions);
          var objectFunction = functions[functionName];
          if(typeof objectFunction != 'undefined') {
              cleanTooltips();
              disposable = atom.tooltips.add(e.target, {
                title: "<div class='text-left'><div><strong>Signature: </strong>" + objectFunction[0].signature + "</div> <div><strong> Schema: </strong>" + objectFunction[0].schema + "</div> <div><strong>Return Type: </strong>" + objectFunction[0].returnType + "</div></div>",
                trigger: 'manual',
                html: true
              });

              functionName = '';
          } else {
            cleanTooltips();
          }
        });

        subscriber.subscribe(scroll, 'mousemove', function (e) {
          cleanTooltips();
        });

        atom.commands.add('atom-text-editor', 'editor:will-be-removed', function (e) {
            subscriber.unsubscribe();
        });

        function getFunctionNameOfList(listFunctions) {
          var word = editor.getWordUnderCursor();
          var wordStriped = S(word).strip('(','\'').s;
          if (typeof listFunctions[wordStriped] != 'undefined') {
            return functionName = wordStriped;
          } else {
            return undefined;
          }
        }

        function getFunctionName() {
          return functionName;
        }

        function getFromShadowDom(element, selector) {
            var el = element[0];
            var found = el.rootElement.querySelectorAll(selector);
            return atom_space_pen_views_1.$(found[0]);
        }

        function cleanTooltips(){
          if ((typeof disposable != 'undefined') && (disposable.disposed == false)) {
             disposable.dispose();
          }
        }
      }
  });
}

export default {
  getSuggestion: getSuggestion,
  getFunctionDefinition: getFunctionDefinition
}
