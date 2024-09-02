const path = require('path');

const sourcePath = path.resolve(__dirname, 'src/main/assets/js');
const govukFrontend = require(path.resolve(__dirname, 'webpack/govukFrontend'));
const videoJsWebpack = require(path.resolve(__dirname, 'webpack/videojsWebpack'));
const customAssets = require(path.resolve(__dirname, 'webpack/customAssets'));
const scss = require(path.resolve(__dirname, 'webpack/scss'));
const HtmlWebpack = require(path.resolve(__dirname, 'webpack/htmlWebpack'));

const devMode = process.env.NODE_ENV !== 'production';
const fileNameSuffix = devMode ? '-dev' : '.[contenthash]';
const filename = `[name]${fileNameSuffix}.js`;

module.exports = {
  plugins: [
    ...govukFrontend.plugins,
    ...videoJsWebpack.plugins,
    ...scss.plugins,
    ...HtmlWebpack.plugins,
    ...customAssets.plugins,
  ],
  entry: path.resolve(sourcePath, 'index.ts'),
  mode: devMode ? 'development' : 'production',
  module: {
    rules: [
      ...scss.rules,
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'src/main/public/'),
    publicPath: '',
    filename,
  },
};
