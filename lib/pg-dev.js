'use babel';

import { CompositeDisposable } from 'atom';

const suggestProvider = require('./provider.js');
const GoToProvider = require('./go-to-provider.js');

export default {

  pgDevView: null,
  modalPanel: null,
  subscriptions: null,

  config: {
    'dbUser':{
      type:'string',
      default:'postgres',
    },
    'dbPass':{
      type:'string',
      default:'postgres',
    },
    'dbHost':{
      type:'string',
      default:'localhost',
    },
    'dbName':{
      type:'string',
      default:'bbplatform',
    },
    'dbPort':{
      type:'string',
      default:'5432',
    },
    'sourceDirectory':{
      type:'string',
      default:'/projects/bbplat_database/platform/src/bbplatform',
    },
    'outputFile':{
      type:'string',
      default:'/tmp/output.sql',
    }
  },
  activate(state) {
    // var path = '/Users/abe/Documents/workspace/work/bbplat_database/platform/src/bbplatform/';
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    // TODO: Get the root of current project
    // atom.workspace.getActiveTextEditor()
    suggestProvider.init(this.config.sourceDirectory.default);
    this.goToProvider = new GoToProvider();
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.pgDevView.destroy();
  },

  // serialize() {
  //   return {
  //     pgDevViewState: this.pgDevView.serialize()
  //   };
  // },


  getProvider(){
    return suggestProvider;
  },

  getProviderGoTo(){
    return this.goToProvider.getSuggestion();
  },

  watch(){

  },
  generateFile(){

  },
  generateFileQuery(){

  }
};
