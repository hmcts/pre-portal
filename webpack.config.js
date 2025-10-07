import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import govukFrontend from './webpack/govukFrontend.js';
import mkWebpack from './webpack/mkWebpack.js';
import customAssets from './webpack/customAssets.js';
import scss from './webpack/scss.js';
import htmlWebpack from './webpack/htmlWebpack.js';

const require = createRequire(import.meta.url);
let CopyWebpackPlugin;
try {
  const mod = require('copy-webpack-plugin');
  CopyWebpackPlugin = mod.default || mod;
} catch (eRoot) {
  const dist = require('copy-webpack-plugin/dist/index.js');
  CopyWebpackPlugin = dist.default || dist;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const devMode = process.env.NODE_ENV !== 'production';
const sourcePath = path.resolve(__dirname, 'src/main/assets/js');
const fileNameSuffix = devMode ? '-dev' : '.[contenthash]';
const filename = `[name]${fileNameSuffix}.js`;

const assetPatterns = [
  ...(govukFrontend.patterns || []),
  ...(mkWebpack.patterns || []),
  ...(customAssets.patterns || []),
];

const copyAssetsPlugin = new CopyWebpackPlugin({ patterns: assetPatterns });

export default {
  mode: devMode ? 'development' : 'production',
  entry: path.resolve(sourcePath, 'index.ts'),
  plugins: [...(scss.plugins || []), ...(htmlWebpack.plugins || []), copyAssetsPlugin],
  module: {
    rules: [
      ...(scss.rules || []),
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
    clean: true,
  },
  infrastructureLogging: { level: 'warn' },
  stats: devMode ? 'minimal' : 'normal',
};
