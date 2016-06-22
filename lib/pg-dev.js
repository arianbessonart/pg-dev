'use babel';

import { CompositeDisposable } from 'atom';

const suggestProvider = require('./provider.js');
const goToProvider = require('./go-to-provider.js');
var fileSynchronize = require('./file-synchronize')
var fileManager = require('./file-manager');
import packageConfig from './pg-dev-config.json';

export default {

  subscriptions: null,
  config: packageConfig,

  activate(state) {
    require('atom-package-deps').install('pg-dev');
    this.subscriptions = new CompositeDisposable();
    var sourceDirectory = atom.config.get('pg-dev.sourceDirectory');
    fileSynchronize.init(sourceDirectory);
    goToProvider.getFunctionDefinition();

    suggestProvider.init();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pg-dev:generateSelect': () => this.generateSelect()
    }));
  },

  deactivate() {
    fileSynchronize.stopWatch();
    this.subscriptions.dispose();
  },

  getProvider(){
    return suggestProvider;
  },

  getProviderGoTo(){
    return goToProvider.getSuggestion();
  },

  generateSelect() {
    fileManager.generateSelect(atom.workspace.getActiveTextEditor(), atom.workspace.getActiveTextEditor().getCursorBufferPosition());
  },

  watch(){

  },
  generateFile(){

  },
  generateFileQuery(){

  }
};
