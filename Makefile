
export PATH := node_modules/.bin:$(PATH)

js:
	webpack


js-watch:
	webpack -w

css-watch:
	node-sass \
		--include-path node_modules/bootstrap-sass/assets/stylesheets/ \
		--include-path node_modules/bourbon/app/assets/stylesheets/ \
		--source-map \
		--watch \
		--output build \
		styles.scss styles.css

server:
	live-server .

