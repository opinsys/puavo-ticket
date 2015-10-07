// Polyfill Promise global for style loaders
global.Promise = require("bluebird");

var webpack = require("webpack");

var config = {
    entry: "./client.js",
    output: {
        path: __dirname + "/public/build",
        filename: "bundle.js",
        publicPath: "/build/"
    },
    devtool: "cheap-module-eval-source-map",
    plugins: [
         new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
        })
    ],
    module: {
        loaders: [
            {test: /\.jsx?$/, exclude: /node_modules/, loader: "babel-loader"},
            {
                test: /\.scss$/,
                loaders: ["style", "css?sourceMap", "sass?sourceMap"]
            }
        ]
    }
};


if (process.env.NODE_ENV === "production") {
    config.devtool = "source-map";
    delete config.output.publicPath;
}

module.exports = config;
