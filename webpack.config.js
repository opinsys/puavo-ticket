var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: "./client.js",
    output: {
        path: __dirname + "/public/build",
        filename: "bundle.js"
    },
    devtool: "source-map",
    module: {
        loaders: [
            {test: /\.jsx?$/, exclude: /node_modules/, loader: "babel-loader"},
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract(
                    // activate source maps via loader query
                    "css?sourceMap!" +
                    "sass?sourceMap"
                )
            }
        ]
    },
    plugins: [
        // extract inline css into separate 'styles.css'
        new ExtractTextPlugin("bundle.css")
    ]
};
