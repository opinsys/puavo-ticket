
export PATH := node_modules/.bin:$(PATH)

all: npm

npm:
	npm install

migrate:
	knex migrate:latest

.PHONY: test
test:
	rm book.db
	$(MAKE) migrate
	mocha -C test/*_test.js
