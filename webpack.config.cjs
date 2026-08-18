const path = require('path');

const sourcePath = path.resolve(__dirname, 'src/main/assets/js');
const govukFrontend = require(path.resolve(__dirname, 'webpack/govukFrontend.cjs'));
const mkWebpack = require(path.resolve(__dirname, 'webpack/mkWebpack.cjs'));
const videoPlayerWebpack = require(path.resolve(__dirname, 'webpack/videoPlayerWebpack.cjs'));
const customAssets = require(path.resolve(__dirname, 'webpack/customAssets.cjs'));
const scss = require(path.resolve(__dirname, 'webpack/scss.cjs'));
const HtmlWebpack = require(path.resolve(__dirname, 'webpack/htmlWebpack.cjs'));

const devMode = process.env.NODE_ENV !== 'production';
const fileNameSuffix = devMode ? '-dev' : '.[contenthash]';
const filename = `[name]${fileNameSuffix}.js`;

module.exports = {
  plugins: [
    ...govukFrontend.plugins,
    ...mkWebpack.plugins,
    ...videoPlayerWebpack.plugins,
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


