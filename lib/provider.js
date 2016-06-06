'use babel';

var fuzzy = require('fuzzy');
var _ = require('lodash');
var Parser = require('./parser/parser');

export default class PgProvider {
  constructor(basePath) {
    self = this;
    this.selector = '.source.sql';
    this.disableForSelector = '.source.sql .comment';
    this.excludeLowerPriority = true;
    this.inclusionPriority = 1;
    this.parser = new Parser();
    this.storeData = {};
    this.parser.parseFunctions(basePath, (functionsData) => {
      self.storeData = functionsData;
    });
  }

  getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    if (prefix.length < 2){
        return;
    }
    // let storeData = {
    //   "md_act_get_by_event_type_service_id":{
    //     "return":"integer",
    //     "params": {
    //       "in": [{"name":"m_event_type_service_id", "type":"integer"}],
    //     }
    //   },
    //   "md_comm_type_get_by_name":{
    //     "return":"record",
    //     "params": {
    //       "in": [{"name":"m_name", "type":"text"}],
    //       "out": [
    //         {"name":"m_name", "type":"text"},
    //         {"name":"m_comm_type_id", "type":"integer"}
    //       ],
    //     }
    //   },
    //   "md_et_get_by_nt_name_act_name_at_name":{
    //     "return":"record",
    //     "params": {
    //       "in": [
    //         {"name": "m_name_nt", "type":"text"},
    //         {"name": "m_name_act", "type":"text"},
    //         {"name": "m_name_at", "type":"text"}
    //       ],
    //       "out": [
    //         {"name": "m_event_type_id", "type":"integer"},
    //         {"name": "m_notification_type_id", "type":"integer"},
    //         {"name": "m_action_id", "type":"integer"},
    //         {"name": "m_action_type_id", "type":"integer"},
    //         {"name": "m_action_category_id", "type":"integer"},
    //         {"name": "m_name_acc", "type":"text"}
    //       ]
    //     }
    //   }
    // };

    //Must get the prev word and evaluate if it is (FROM or .)
    self = this;
    var result = _.keys(self.storeData);
    var results = fuzzy.filter(prefix, result)
    var matches = results.map(function(el) {
      return el.string;
    });

    let allSuggestions = new Array();
    var match = undefined;
    _.forEach(matches, function (value) {
      match = self.storeData[value];
      var snippet = PgProvider.createSnippet(value, match.params.in);
      allSuggestions.push({"text":value, "type":"function", "leftLabel":match.returnType, "snippet":snippet});
    });
    // allSuggestions.push({"text":"get_event_type_id_snippet", "snippet":"get_event_type_id_snippet(${1:integer}, ${2:text})${3}", "type":"function", "description": "get id of event types", "leftLabel":"integer"});
    return allSuggestions;
  }

  static createSnippet(functionName, inParams) {
    var snippet = functionName + "(";
    var index = 1;
    _.map(inParams, (param) => {
      snippet += "${"+(index++)+":"+param.name+" "+param.type+"}, ";
    });
    snippet = snippet.trim().replace(/\,$/, '');
    snippet += ")${"+(index++)+"}";
    return snippet;
  }


}
