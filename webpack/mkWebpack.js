const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const rootExport = require.resolve('@mediakind/mkplayer');
const root = path.resolve(rootExport, '..');
const copyMediaKindAssets = new CopyWebpackPlugin({
  patterns: [
    { from: `${root}/mkplayer.js`, to: 'assets/js' },
    { from: `${root}/mkplayer-ui.css`, to: 'assets/css' },
  ],
});

module.exports = {
  paths: { template: root },
  plugins: [copyMediaKindAssets],
};
