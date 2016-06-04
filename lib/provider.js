'use babel';

export default class PgCompletionProvider {
  constructor() {
    this.selector = '.source.sql';
    this.disableForSelector = '.source.sql .comment';
    this.excludeLowerPriority = true;
    this.inclusionPriority = 1;
  }
  
  getSuggestions({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
    console.log('Inside getSuggestions');
    console.log(editor);
    console.log(bufferPosition);
    console.log(scopeDescriptor);
    console.log(prefix);
    console.log(activatedManually);
      if (prefix.length < 2){
          return;
      }
  
      let allSuggestions = new Array();
      allSuggestions.push({"text":"get_event_type_id_snippet", "snippet":"get_event_type_id_snippet(${1:arg1}, ${2:arg2})"});
      allSuggestions.push({"text":"test2"});
      allSuggestions.push({"text":"test3"});
      allSuggestions.push({"text":"test4"});
      return allSuggestions;
  }
  
}