export PATH := node_modules/.bin:$(PATH)
export PATH := tools/bin:$(PATH)

prefix ?= /usr/local

# Use jsxhint wrapper since we use JSX for the React components
JSHINT=jsxhint
KARMA=node_modules/karma/bin/karma

all: npm doc install-git-hooks protip
	@echo
	@echo All OK!
	@echo

protip:
	@echo Protip: Add local node module scripts to PATH
	@echo
	@echo '    export PATH="$(CURDIR)/node_modules/.bin:$$PATH"'
	@echo

npm:
	npm install

migrate:
	knex migrate:latest

drop-db:
	sudo -u postgres psql -c "drop database \"puavo-ticket\"";
	sudo -u postgres psql -c "drop database \"puavo-ticket-test\"";

drop-tables:
	sudo -u postgres psql -c "DROP TABLE attachments,attachments,comments,devices,followers,handlers,migrations, \
		\"readTickets\",related_users,tags,tickets,users,visibilities" puavo-ticket
	sudo -u postgres psql -c "DROP TABLE attachments,attachments,comments,devices,followers,handlers,migrations, \
		\"readTickets\",related_users,tags,tickets,users,visibilities" puavo-ticket-test

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
	rm -f test/components/bundle.js
	yuidoc \
		--themedir yuidoc-theme \
		--exclude test/vendor,node_modules,doc,resources \
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
	$(JSHINT) $?

browserify-test: jshint
	browserify -d -t reactify test/client.js -o test/bundle.js

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
	mocha test/models/server/*_test.js test/api/*_test.js

.PHONY: test
test:
	NODE_ENV=test $(MAKE) migrate
	$(MAKE) jshint
	$(MAKE) test-server
	$(MAKE) test-browsers



serve-tests: browserify-test
	node test/server.js

clean:
	rm -rf doc node_modules

install-dirs:
	mkdir -p mkdir -p $(DESTDIR)$(prefix)/lib/node_modules/puavo-ticket
	mkdir -p $(DESTDIR)$(prefix)/lib/node_modules/puavo-ticket
	mkdir -p $(DESTDIR)/etc

install: install-dirs
	npm prune --production
	cp -r *.js *.json node_modules components resources utils models views styles $(DESTDIR)$(prefix)/lib/node_modules/puavo-ticket
	ln -fs /etc/puavo-ticket/config.json $(DESTDIR)$(prefix)/lib/node_modules/puavo-ticket/_config.json

install-git-hooks:
	cp tools/pre-commit.hook .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo
	@echo Installed a git pre-commit hook to .git/hooks/pre-commit
	@echo

install-ansible:
	apt-get install -y python-software-properties
	apt-add-repository ppa:rquillo/ansible --yes
	apt-get update
	apt-get install -y --force-yes ansible

dev-install:
	# FIXME locale?
	#sudo su -c "echo 'LANG=\"en_US.UTF-8\"' > /etc/default/locale"
	#sudo locale-gen en_US.UTF-8
	#sudo dpkg-reconfigure locales
	ansible-playbook development-env.yml --extra-vars dev_user=$(USER) --extra-vars code_dest=$(HOME)

puavo-start:
	tmux -2 new-session -d -s puavo 'cd /home/opinsys/puavo-users; bundle exec rails s -p 3001'
	tmux split-window -v -d 'cd /home/opinsys/puavo-users/rest; make serve-dev'
	tmux -2 attach-session -t puavo
