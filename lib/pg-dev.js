'use babel';

import PgDevView from './pg-dev-view';
import { CompositeDisposable } from 'atom';

export default {

  pgDevView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.pgDevView = new PgDevView(state.pgDevViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.pgDevView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pg-dev:toggle': () => this.toggle()
    }));
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

  toggle() {
    console.log('PgDev was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
