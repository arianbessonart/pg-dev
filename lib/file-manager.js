'use babel';


var Parser = require('./parser/parser');
var variables = {"m_name":"text", "m_event_type_id": "integer"};

export default {

  getVariables() {
    return variables;
  },

}
