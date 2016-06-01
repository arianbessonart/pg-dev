'use babel';

import PgDevView from './pg-dev-view';
import { CompositeDisposable } from 'atom';

export default {

  pgDevView: null,
  modalPanel: null,
  subscriptions: null,

  config: {
    'db-user':{
      type:'string',
      default:'postgres',
    },
    'db-pass':{
      type:'string',
      default:'postgres',
    },
    'db-host':{
      type:'string',
      default:'localhost',
    },
    'db-name':{
      type:'string',
      default:'bbplatform',
    },
    'db-port':{
      type:'string',
      default:'5432',
    },
    'source-directory':{
      type:'string',
      default:'/projects/bbplat_database/platform/src/bbplatform',
    },
    'output-file':{
      type:'string',
      default:'/tmp/output.sql',
    }
  },
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

  watch(){

  },
  generateFile(){

  },
  generateFileQuery(){

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
