"use babel";


function getTablesSQL() {
  return "SELECT table_schema, table_name, table_type\
         FROM information_schema.tables\
         WHERE substr(table_schema, 1, 3) != 'pg_' and table_schema != 'information_schema'\
         order by table_schema, table_type, table_name;";
}

function getFunctionsSQL() {
  return "SELECT ns.nspname, ns.nspname || '.' || proname ||\
          '(' || oidvectortypes(proargtypes) || ')' as function_name\
          FROM pg_proc p INNER JOIN pg_namespace ns ON (p.pronamespace = ns.oid)\
          WHERE substr(ns.nspname, 1, 3) != 'pg_' and ns.nspname != 'information_schema';";
}

export default {
  getTablesSQL: getTablesSQL,
  getFunctionsSQL: getFunctionsSQL
}
