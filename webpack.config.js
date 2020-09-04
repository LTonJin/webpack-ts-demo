
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
var path = require('path');

module.exports = {
    mode: 'development',
    entry: __dirname + '/src/index.ts',
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'meeting-connect-sdk.js',
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: {
                loader: 'ts-loader'
            }
        }, ]
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "@": __dirname + "/src"
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './public/index.html'),
        }),
        new CleanWebpackPlugin(),
        new UglifyJsPlugin()
    ]
}