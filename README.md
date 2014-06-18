# puavo-ticket

Cool new ticketing system with deep puavo integration.

**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [puavo-ticket](#user-content-puavo-ticket)
	- [Roles](#user-content-roles)
	- [Ticket handler](#user-content-ticket-handler)
	- [Visibilities](#user-content-visibilities)
- [Development Documentation](#user-content-development-documentation)
	- [Project structure](#user-content-project-structure)
	- [Installation for development](#user-content-installation-for-development)
	- [Development tools](#user-content-development-tools)
		- [Editors](#user-content-editors)
		- [Setup PATH](#user-content-setup-path)
	- [Running tests](#user-content-running-tests)
	- [Debug browser Javascript](#user-content-debug-browser-javascript)
	- [Debug server Javascript](#user-content-debug-server-javascript)
	- [Debug server tests](#user-content-debug-server-tests)
	- [Debug SQL](#user-content-debug-sql)
	- [Debug logging](#user-content-debug-logging)
	- [puavo-ticket API documentation](#user-content-puavo-ticket-api-documentation)
		- [External documentation](#user-content-external-documentation)
## Roles

The system has currently only to types of users. Managers (Opinsys staff in our
case) and clients.

There are currently only two differences:

  1. Clients can only see the tickets they have visibility to - managers can see all the tickets
  2. Managers can add handlers to tickets

## Ticket handler

When client has only a visibility to a ticket he/she do following:

  - Comment
  - Follow the ticket
  - Add related users
  - Add related devices

but when user is a handler for a ticket he/she can also:

  - Close or reopen the ticket
  - Add visibilities

Ticket creator is automatically a handler.

## Visibilities

Users and tickets have visibility properties. Users see the tickets where the
visibility properties match.

A client has following visibility properties by default:

  - Own visibility
  - School visibility
  - Organisation visibility

When ticket is created it will get only the visibility of the user who created
it. Ticket will get additional visibilities when:

  - A handler is added: handler's own visiblity
  - Follower is added: followe's own visibility
  - Visibility is explicitly added by a handler
    - For example school visibility

# Development Documentation

## Project structure

- `server.js`
  - node.js entry point for the server
- `client.js`
  - client-side entry point for the UI
  - This is bundled up with [Browserify][] and is sent to the browsers by the server
- `components/`
  - UI components build with [React][]
  - These use the [React JSX preprocessor](http://facebook.github.io/react/docs/jsx-in-depth.html)
- `models/server/`
  - Server-side [Bookshelf][] models
- `models/client/`
  - Client-side [Backbone][] models
- `models/*Mixin.js`
  - Shared model mixins for both client and server models
- `utils/`
  - Various helper utilities. May be used in the server and/or the client
- `resources`
  - [Express][] REST API routes
- `test`
  - All project tests
- `test/server.js`
  - node.js entry point for UI component test server
  - Used to run and debug component tests in actual browsers
- `test/components/`
  - The [Mocha][] UI component tests
- `test/helpers.js`
  - Various server-side test helpers
- `test/models/server/`
  - [Mocha][] tests for the server-side models
- `test/models/client/`
  - [Mocha][] tests for the client-side models
- `tools/`
  - Internal project tools. Such as git-hooks, inotify watcher helpers etc.
- `vendor-documentation/`
  - Just links to external libraries. Used by YUIDoc

## Installation for development

You must have node.js and build-essentials installed.

    git clone https://github.com/opinsys/puavo-ticket.git
    cd puavo-ticket
    make

Create `_config.json` with

```json
{
    "puavo": {
        "sharedSecret":"secret",
        "authEndpoint": "https://rest.example.com/v3/sso",
        "mountPoint": "https://ticket.example.com",
        "user": "admin",
        "pass": "xxxxx"
    }
}
```

where `xxxxx` is the sso secret of puavo and `puavo` is an authentication object
for puavo api [requests](https://github.com/mikeal/request#http-authentication).

Run database migrations

    make migrate

and start the server with

    node server.js

### or configure full development machine with Ansible

..or install puavo-ticket with puavo-web and puavo-rest (ansible)

```bash
sudo apt-get install -y python-software-properties git
sudo apt-add-repository ppa:rquillo/ansible --yes
sudo apt-get update
sudo apt-get install -y ansible


git clone https://github.com/opinsys/puavo-ticket.git
cd puavo-ticket
sudo ansible-playbook development-env.yml --extra-vars dev_user=$USER --extra-vars code_dest=$HOME
```


## Development tools

First install the local git pre-commit hooks

    make install-git-hooks

This will prevent you from committing broken or trivially bad Javascript. It
uses [JSHint][] to automatically validate the staged Javascript files when you
try to commit them.


and start puavo-web and puavo-rest

```bash
make puavo-start
```

### Editors

Better yet you should integrate real time JSHint validation to your editor.

You will also want a JSX support if you edit anything under `components/`. When
editing them `jsxhint` wrapper for JSHint must be used. It's installed in
`node_modules/.bin/`. `jsxhint` can be used for the plain js files too.

See <http://facebook.github.io/react/docs/tooling-integration.html#syntax-highlighting-amp-linting>

### Setup PATH

You might want to put locally installed node.js tools to your path

    export PATH="$(pwd)/node_modules/.bin:$PATH"

This will give you direct access and tab completion to `mocha`, `jsxhint` and
other tools.

## Running tests

Use

  - `make jshint` to run jshint for all project \*.js files
  - `make test-server` to run all server-side tests
  - `make test-browsers` to run all client-side tests
    - You must have Firefox and Chromium installed
  - `make test` to run all tests
  - `make serve-tests` to manually run the client-side tests from
    <http://localhost:1234/> for debugging
    - This will open a browser for you using `xdg-open` if you have a X server running

## Debug browser Javascript

For any browser code you can just add a `debugger;` statement and the browser
break on it when devtools are open.

## Debug server Javascript

For server code to break on debugger statements you must start the server with
the debug command:

    node debug server.js

This will break on the first line. Use enter `c` to continue. See [node.js
debbugger documentation](http://nodejs.org/api/debugger.html) for more
information.

## Debug server tests

Server-side tests can be debugged similarly using the `mocha` command:

    mocha debug test/api/tickets_test.js

If you like GUIs the server can be debugged with
[node-inspector](https://github.com/node-inspector/node-inspector) too.

## Debug SQL

Set `SQL` environment variable to `1` or `true`

Example: `SQL=1 make test-server` or `SQL=1 node server.js`

## Debug logging

We are using the [debug](https://github.com/visionmedia/debug) module. For each
.js file create own debug instance with a name `puavo-ticket:<path>` where the
`<path>` is the path for the .js file.

Example:

```javascript
var debug = require("debug")("puavo-ticket:resources/tickets");
```

Using the `puavo-ticket:` prefix we can enable debug logging for puavo-ticket
server with a `DEBUG` environment variable:

    DEBUG=puavo-ticket:* node server.js

or for the browser using a Javascript console:

```javascript
debug.enable("puavo-ticket:*");
```

## puavo-ticket API documentation

The Javascript API documentation is generated with [YUIDoc][] and is available
in

<http://opinsys.github.io/puavo-ticket/>

REST API documentation is generated using [apiDoc][] from `resources/` and is
available in

<http://opinsys.github.io/puavo-ticket/rest/>

Documentation can be build with `make doc` and published with `make
doc-publish`. During development the documentation is also available in `/doc`
from the puavo-ticket server.

### External documentation

  - [Javascript core reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference)
  - [node.js core api](http://nodejs.org/api/)
  - [express](http://expressjs.com/4x/api.html) as the server-side framework
  - [Bluebird Promises API](https://github.com/petkaantonov/bluebird/blob/master/API.md)
    - Promises are used extensively for asynchronous operations in puavo-ticket
    - We use the Bluebird implementation
    - General Promises intro <http://www.html5rocks.com/en/tutorials/es6/promises/>
  - [Lo-Dash](http://lodash.com/) various functional Javascript utilities
  - [React](http://facebook.github.io/react/) for client-side views
      - [API](http://facebook.github.io/react/docs/component-api.html)
      - [Lifecycle](http://facebook.github.io/react/docs/component-specs.html)
  - [Backbone][] as the client-side models
    - And those only! No Router or views
  - [Bookshelf][] as the server-side database ORM
  - [Knex.js](http://knexjs.org/) The query builder of bookshelf

For testing

  - [Mocha](http://visionmedia.github.io/mocha/)
  - [supertest](https://github.com/visionmedia/supertest) for api testing
  - [React Test Utilities](http://facebook.github.io/react/docs/test-utils.html)


[React]: http://facebook.github.io/react/
[Bookshelf]: http://bookshelfjs.org/
[Backbone]: http://backbonejs.org/
[Express]: http://expressjs.com/
[apiDoc]: http://apidocjs.com/
[Mocha]: http://visionmedia.github.io/mocha/
[Browserify]: http://browserify.org/
[JSHint]: http://www.jshint.com/
[YUIDoc]: http://yui.github.io/yuidoc/syntax/
