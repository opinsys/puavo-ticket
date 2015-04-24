
export PATH := node_modules/.bin:$(PATH)

js:
	webpack


js-watch:
	webpack -w

css-watch:
	node-sass --include-path node_modules/bootstrap-sass/assets/stylesheets/ --watch --output build styles.scss styles.css

server:
	live-server .

