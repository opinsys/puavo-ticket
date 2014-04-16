
# puavo-ticket

## Running

Install node.js and run `make`

Create `_config.json` with

```json
{
    "puavoSharedSercret": "xxxxx"
}
```

where `xxxxx` is the sso secret of puavo.

Run database migrations with `make migrate`.

Start the server with `node server.js`.

## Development Documentation

Internal

  - [puavo-ticket Javascript API](http://opinsys.github.io/puavo-ticket/)
  - [puavo-ticket REST API](http://opinsys.github.io/puavo-ticket/rest/)

Relevant external libraries

  - [node.js](http://nodejs.org/api/)
  - [express](http://expressjs.com/4x/api.html) as the server-side framework
  - [Bluebird Promises API](https://github.com/petkaantonov/bluebird/blob/master/API.md)
  - [Lo-Dash](http://lodash.com/) various Javascript utilities
  - [React](http://facebook.github.io/react/) for client-side views
      - [API](http://facebook.github.io/react/docs/component-api.html)
      - [Lifecycle](http://facebook.github.io/react/docs/component-specs.html)
  - [Backbone.js](http://backbonejs.org/) as the client-side models
    - And those only! No Router or views
  - [Bookshelf.js](http://bookshelfjs.org/) as the server-side database ORM
  - [Knex.js](http://knexjs.org/) The query builder of bookshelf

For testing

  - [Mocha](http://visionmedia.github.io/mocha/)
  - [supertest](https://github.com/visionmedia/supertest) for api testing
  - [React Test Utilities](http://facebook.github.io/react/docs/test-utils.html)

Documenting

  - [YUIDoc Syntax Reference](http://yui.github.io/yuidoc/syntax/)
    - Used to build the puavo-ticket Javascript API documentation
  - [apiDoc](http://apidocjs.com/)
    - Used to build the puavo-ticket REST API documentation

Use

  - `make doc` to build the documentation
  - `make doc-publish` to publish it on <http://opinsys.github.io/puavo-ticket/>
  - `make doc-watch` to continuously build the documentation
    - The documentation is also available within the application in <http://localhost:3000/doc>

## Testing

Use

  - `make jshint` to run jshint for all project \*.js files
  - `make test-server` to run all server-side tests
  - `make test-browsers` to run all client-side tests
    - You must have Firefox and Chromium installed
  - `make test` to run all tests
  - `make serve-tests` to manually run the client-side tests from <http://localhost:1234/>
    - This will open a browser for you using `xdg-open` if you have a X server running

