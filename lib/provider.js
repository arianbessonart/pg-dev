'use babel';

var fuzzy = require('fuzzy');
var _ = require('lodash');


export default class PgCompletionProvider {
  constructor() {
    this.selector = '.source.sql';
    this.disableForSelector = '.source.sql .comment';
    this.excludeLowerPriority = true;
    this.inclusionPriority = 1;
  }

  getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    if (prefix.length < 2){
        return;
    }
    let storeData = {
      "md_act_get_by_event_type_service_id":{
        "return":"integer",
        "params":[{"name":"m_event_type_service_id", "type":"integer"}]
      },
      "md_comm_type_get_by_name":{
        "return":"record",
        "params":[{"name":"m_name", "type":"text"}, {"name":"m_comm_type_id", "type":"integer"}]
      }
    };

    //Must get the prev word and evaluate if it is (FROM or .)
    console.log(storeData);
    var result = _.keys(storeData);
    console.log(result);
    var results = fuzzy.filter(prefix, result)
    var matches = results.map(function(el) {
      return el.string;
    });
    console.log(matches);

    let allSuggestions = new Array();
    var match = undefined;
    _.forEach(matches, function (value) {
      match = storeData[value];
      allSuggestions.push({"text":value, "leftLabel":match.return});
    });
    // allSuggestions.push({"text":"get_event_type_id_snippet", "snippet":"get_event_type_id_snippet(${1:integer}, ${2:text})${3}", "type":"function", "description": "get id of event types", "leftLabel":"integer"});
    // allSuggestions.push({"text":"test2"});
    // allSuggestions.push({"text":"test3"});
    // allSuggestions.push({"text":"test4"});
    return allSuggestions;
  }

}
