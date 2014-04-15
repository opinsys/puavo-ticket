
# puavo-ticket

## Hacking

Install node.js and run `make`

Create `_config.json` with

```json
{
    "puavoSharedSercret": "xxxxx"
}
```

where `xxxxx` is the sso secret of puavo

start the server with `node server.js`

## Documentation

Internal

  - [puavo-ticket Javascript API](http://opinsys.github.io/puavo-ticket/)
  - [puavo-ticket REST API](http://opinsys.github.io/puavo-ticket/rest/)

Relevant external libraries

  - [node.js](http://nodejs.org/api/)
  - [express](http://expressjs.com/4x/api.html) - as the server-side framework
  - [Bluebird Promises API](https://github.com/petkaantonov/bluebird/blob/master/API.md)
  - [Lo-Dash](http://lodash.com/) - various Javascript utilities
  - React - client-side views
      - [API](http://facebook.github.io/react/docs/component-api.html)
      - [Lifecycle](http://facebook.github.io/react/docs/component-specs.html)
  - [Backbone.js](http://backbonejs.org/)
    - We'll only use the Models and Collections!
  - [Bookshelf.js](http://bookshelfjs.org/) as the database ORM
  - [Knex.js](http://knexjs.org/) The query builder of bookshelf
  - [YUIDoc Syntax Reference](http://yui.github.io/yuidoc/syntax/)
    - Used to build the puavo-ticket Javascript API documentation
  - [apiDoc](http://apidocjs.com/)
    - Used to build the puavo-ticket REST API documentation

For testing

  - [Mocha](http://visionmedia.github.io/mocha/)
  - [supertest](https://github.com/visionmedia/supertest) for api testing
  - [React Test Utilities](http://facebook.github.io/react/docs/test-utils.html)

