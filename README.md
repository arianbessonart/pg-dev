## pg-dev package

[![Join the chat at https://gitter.im/arianbessonart/pg-dev](https://badges.gitter.im/arianbessonart/pg-dev.svg)](https://gitter.im/arianbessonart/pg-dev?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

pg-dev is a package for Atom editor, in order to help developing on PostgreSQL (functions).

### How?
Load functions from file system, so you **MUST** have the functions mapped there.

### Features
* Suggest Functions
* Suggest Variables
* Suggest Data Types
* Suggest Out parameters on function. (i.e: get_test('test')).id)
* Suggest parameters on 'record' variable type
* Go to function - open in a new tab (hyperclick) - ctrl+click
* Linter on:
  * Unused variable
  * Undeclared variable
  * Inexistent function
* Function definition (on click)
* Snippets: If, ElseIf, Else, For, Create Function, Raise Notice, Raise Exception, do (anonymous function)

#### Function Definition
![Function Definition](https://raw.githubusercontent.com/arianbessonart/pg-dev/master/gifs/funcdefinition.gif)

### Restrictions
* Every file **MUST HAVE** one and only one function
* The name of the function must be equal than fileName
* The name of the function can not be longer than 64 characters

### TODO
* Connect to a database in order to synchronize functions with file system
* Improve file parser (need Regex expert)
* Add more features gifs
* Add spec/travis-ci
