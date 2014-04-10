
export PATH := node_modules/.bin:$(PATH)
export PATH := tools/bin:$(PATH)

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
test:
	mocha -C test/*/*_test.js
