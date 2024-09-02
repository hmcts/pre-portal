const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const rootExport = require.resolve('video.js');
const root = path.resolve(rootExport, '..');
const copyVideosJsAssets = new CopyWebpackPlugin({
  patterns: [
    { from: `${root}/video.min.js`, to: 'assets/js' },
    { from: `${root}/video-js.min.css`, to: 'assets/css' },
  ],
});

module.exports = {
  paths: { template: root },
  plugins: [copyVideosJsAssets],
};
