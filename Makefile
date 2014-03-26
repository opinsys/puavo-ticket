
export PATH := node_modules/.bin:$(PATH)

all: npm

npm:
	npm install

browserify:
	browserify -d -t reactify client.js > bundle.js

browserify-watch:
	watchify -v -d -t reactify client.js -o bundle.js

commit-js: browserify
	uglifyjs bundle.js -o bundle.js
	git add -f bundle.js
	git commit bundle.js -m "update bundle"
