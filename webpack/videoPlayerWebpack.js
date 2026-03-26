const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const videoJsRoot = path.resolve(require.resolve('video.js/package.json'), '..');
const hlsJsRoot = path.resolve(require.resolve('hls.js/package.json'), '..');

const copyVideoPlayerAssets = new CopyWebpackPlugin({
  patterns: [
    { from: `${videoJsRoot}/dist/video.min.js`, to: 'assets/js' },
    { from: `${videoJsRoot}/dist/video-js.min.css`, to: 'assets/css' },
    { from: `${videoJsRoot}/dist/font`, to: 'assets/css/font' },
    { from: `${hlsJsRoot}/dist/hls.min.js`, to: 'assets/js' },
  ],
});

module.exports = {
  plugins: [copyVideoPlayerAssets],
};
