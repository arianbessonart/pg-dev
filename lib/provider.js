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
