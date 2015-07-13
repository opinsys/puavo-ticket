export PATH := $(CURDIR)/node_modules/.bin:$(PATH)

prefix ?= /usr/local

js_files=$(shell git ls-files "*.js" | grep -v test/vendor | grep -v vendor)

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
	$(MAKE) link

link:
	rm -f node_modules/app
	ln -sf .. node_modules/app


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




js:
	webpack -p

css:
	cd public/build/css && \
		node-sass \
		$(ARGS) \
		--include-path ../../../node_modules/bootstrap-sass/assets/stylesheets/ \
		--include-path ../../../node_modules/bourbon/dist/ \
		--source-map styles.css.map ../../../styles/index.scss styles.css

css-watch:
	$(MAKE) css ARGS=--watch

server:
	node server.js

test-server:
	mocha test/models/server/*_test.js test/api/*_test.js test/utils/*_test.js

.PHONY: test
test:
	NODE_ENV=test $(MAKE) migrate
	$(MAKE) test-server
	$(MAKE) test-acceptance


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
