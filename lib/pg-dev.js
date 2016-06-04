'use babel';

import { CompositeDisposable } from 'atom';

const PgProvider = require('./provider.js');

export default {

  pgDevView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.completionProvider = new PgProvider();
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.pgDevView.destroy();
  },

  serialize() {
    return {
      pgDevViewState: this.pgDevView.serialize()
    };
  },
  
  getProvider(){
    return this.completionProvider;
  },

  // toggle() {
  //   console.log('PgDev was toggled!');
  //   return (
  //     this.modalPanel.isVisible() ?
  //     this.modalPanel.hide() :
  //     this.modalPanel.show()
  //   );
  // }

};
