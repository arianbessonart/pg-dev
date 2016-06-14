'use babel';

import { CompositeDisposable } from 'atom';

const suggestProvider = require('./provider.js');
const goToProvider = require('./go-to-provider.js');
var fileSynchronize = require('./file-synchronize')
import packageConfig from './pg-dev-config.json';

export default {

  pgDevView: null,
  modalPanel: null,
  subscriptions: null,

  config: packageConfig,

  activate(state) {
    this.subscriptions = new CompositeDisposable();
    fileSynchronize.init(this.config.sourceDirectory.default);
    //TODO: Discuss what is the best way to call this.
    goToProvider.test();
    suggestProvider.init();
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

  watch(){

  },
  generateFile(){

  },
  generateFileQuery(){

  }
};
