'use babel';

import { CompositeDisposable } from 'atom';

const suggestProvider = require('./provider.js');
const goToProvider = require('./go-to-provider.js');
var fileSynchronize = require('./file-synchronize')
var fileManager = require('./file-manager');
import packageConfig from './pg-dev-config.json';

export default {

  pgDevView: null,
  modalPanel: null,
  subscriptions: null,

  config: packageConfig,

  activate(state) {
    this.subscriptions = new CompositeDisposable();
    fileSynchronize.init(this.config.sourceDirectory.default);
    suggestProvider.init();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pg-dev:generateSelect': () => this.generateSelect()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.pgDevView.destroy();
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
