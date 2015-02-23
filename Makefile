export PATH := node_modules/.bin:$(PATH)

prefix ?= /usr/local

# Use jsxhint wrapper since we use JSX for the React components
JSHINT=jsxhint
KARMA=node_modules/karma/bin/karma

all: npm doc install-git-hooks js css-min protip
	@echo
	@echo All OK!
	@echo

protip:
	@echo Protip: Add local node module scripts to PATH
	@echo
	@echo '    . .bash_node_modules'
	@echo

repl:
	@babel-node extra/repl.js

psql:
	@babel-node extra/psql.js

npm:
	npm install
	rm -f node_modules/app && ln -sf .. node_modules/app

migrate:
	knex migrate:latest

drop-db:
	sudo -u postgres psql -c "drop database \"puavo-ticket\"";
	sudo -u postgres psql -c "drop database \"puavo-ticket-test\"";

drop-tables:
	babel-node extra/dropAllTables.js

rollback:
	knex migrate:rollback

reset-test-db:
	NODE_ENV=test $(MAKE) rollback
	NODE_ENV=test $(MAKE) migrate

reset-db:
	$(MAKE) rollback
	$(MAKE) migrate

create-test-db:
	echo "\nCreate test database and user to PostgreSQL server (use postgres user)\n"
	su -c "createdb -E UNICODE puavo-ticket-test" postgres
	su -c "createuser -P puavo-ticket-test" postgres

.PHONY: doc
doc-js:
	mkdir -p doc
	rm -f test/components/bundle.js test/bundle.js
	yuidoc \
		--themedir yuidoc-theme \
		--exclude test/vendor,node_modules,doc,resources,build,migrations \
		--outdir doc/ .

doc-rest:
	mkdir -p doc/rest
	apidoc -i resources/ -o doc/rest

doc: doc-js

doc-watch:
	watch make doc

doc-publish:
	extra/publish-docs.sh


js_files=$(shell git ls-files "*.js" | grep -v test/vendor | grep -v vendor)
jshint: $(js_files)
	$(JSHINT) $?

js:
	webpack --optimize-minimize --optimize-dedupe

css:
	node-sass --source-map styles.css.map --source-comments map styles/index.scss --output styles.css
	mv styles.css public/build/
	mv styles.css.map public/build/
	cleancss public/build/styles.css > public/build/styles.min.css

css-min: css
	cleancss public/build/styles.css > public/build/styles.min.css

browserify-test: jshint
	browserify test/client.js -o test/bundle.js

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
	mocha test/models/server/*_test.js test/api/*_test.js test/utils/*_test.js

test-acceptance:
	NODE_ENV=production START_TEST_SERVER=1 PORT=2000 mocha --timeout 300000 -b test/acceptance/*_test.js

.PHONY: test
test:
	NODE_ENV=test $(MAKE) migrate
	$(MAKE) jshint
	$(MAKE) test-server
	$(MAKE) test-browsers
	$(MAKE) test-acceptance



serve-tests: browserify-test
	babel-node test/server.js

clean-build:
	rm -f public/build/*.json
	rm -f public/build/*.js
	rm -f public/build/*.map
	rm -f public/build/*.css

clean: clean-build
	rm -rf doc node_modules public/build/*.js public/build/*.json

install-dirs:
	mkdir -p mkdir -p $(DESTDIR)$(prefix)/lib/puavo-ticket
	mkdir -p $(DESTDIR)$(prefix)/lib/puavo-ticket
	mkdir -p $(DESTDIR)/etc

install: install-dirs
	npm prune --production
	cp -r *.js *.json Makefile migrations node_modules components resources utils models views styles public $(DESTDIR)$(prefix)/lib/puavo-ticket
	ln -fs /etc/puavo-ticket/config.json $(DESTDIR)$(prefix)/lib/puavo-ticket/_config.json

install-git-hooks:
	cp extra/pre-commit.hook .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo
	@echo Installed a git pre-commit hook to .git/hooks/pre-commit
	@echo

send-emails:
	babel-node extra/sendEmails.js

install-build-dep:
	mk-build-deps --install debian.default/control \
		--tool "apt-get --yes --force-yes" --remove

deb:
	rm -rf debian
	cp -a debian.default debian
	dpkg-buildpackage -us -uc
