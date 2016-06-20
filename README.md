## pg-dev package

pg-dev is a package for Atom editor, in order to help developing on PostgreSQL (functions).

### How?
Load functions from fs, so you **MUST** have the functions mapped there.

### Features
* Suggest Functions
* Suggest Variables
* Suggest Data Types
* Suggest Out parameters on function. (i.e: get_test('test')).id)
* Notify when a variable is unused
* Add alter owner on the end of the file


### Restrictions
* Every file **MUST HAVE** one and only one function
* The name of the function must be equal than fileName
* The name of the function must be can not be longer than 64 characters

### TODO
* Connect to a database in order to synchronize functions with fs.
