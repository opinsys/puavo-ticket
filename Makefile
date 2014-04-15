
export PATH := node_modules/.bin:$(PATH)
export PATH := tools/bin:$(PATH)

# Use jsxhint wrapper since we use JSX for the React components
JSHINT=jsxhint
KARMA=node_modules/karma/bin/karma

all: npm doc

npm:
	npm install

migrate:
	knex migrate:latest

.PHONY: doc
doc-js:
	mkdir -p doc
	yuidoc \
		--themedir yuidoc-theme \
		--exclude test,node_modules,doc \
		--outdir doc/ .

doc-rest:
	mkdir -p doc/rest
	apidoc -i resources/ -o doc/rest
	
doc: doc-js doc-rest

doc-watch:
	watch make doc

doc-publish:
	tools/bin/publish-docs


js_files=$(shell git ls-files "*.js" | grep -v test/vendor)
jshint: $(js_files)
	$(JSHINT) --config .jshintrc $(JSHINTFLAGS) $?

browserify-test: jshint
	browserify -d -t reactify test/components/index.js -o test/components/bundle.js

browserify-test-watch:
	watchify -v -d -t reactify test/components/index.js -o test/components/bundle.js

export CHROME_BIN := chromium-browser
test-chrome: browserify-test
	$(KARMA) start --single-run --browsers Chrome

test-firefox: browserify-test
	$(KARMA) start --single-run --browsers Firefox

test-browsers: test-chrome test-firefox

test-browsers-watch: browserify-test
	@echo
	@echo "Also run 'make browserify-test-watch'"
	@echo
	$(KARMA) start

test-server: jshint
	mocha --no-colors --reporter spec test/models/*_test.js test/api/*_test.js

.PHONY: test
test: jshint test-server test-browsers

serve-tests:
	@echo Open http://localhost:1234/test.html
	serve -p 1234 .

clean:
	rm -rf doc node_modules
