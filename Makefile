
export PATH := node_modules/.bin:$(PATH)
export PATH := tools/bin:$(PATH)

# Use jsxhint wrapper since we use JSX for the React components
JSHINT=jsxhint

all: npm doc

npm:
	npm install

migrate:
	knex migrate:latest

.PHONY: doc
doc:
	yuidoc \
		--themedir yuidoc-theme \
		--outdir doc/ .

doc-watch:
	watch make doc

.PHONY: test
test: jshint
	mocha -C test/models/*_test.js test/api/*_test.js

js_files=$(shell git ls-files "*.js")
jshint: $(js_files)
	$(JSHINT) --config .jshintrc $(JSHINTFLAGS) $?

clean:
	rm -rf doc node_modules
