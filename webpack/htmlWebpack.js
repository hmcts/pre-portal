import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let HtmlWebpackPlugin;
try {
  const mod = require('html-webpack-plugin');
  HtmlWebpackPlugin = mod.default || mod;
} catch (eRoot) {
  try {
    const alt = require.resolve('html-webpack-plugin/index.js');
    const mod2 = require(alt);
    HtmlWebpackPlugin = mod2.default || mod2;
  } catch (eDist) {
    throw new Error(
      `Unable to resolve html-webpack-plugin: root error: ${eRoot.message}; index error: ${eDist.message}`
    );
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cssPath = path.resolve(__dirname, '../src/main/views/webpack/css-template.njk');
const jsPath = path.resolve(__dirname, '../src/main/views/webpack/js-template.njk');

const cssWebPackPlugin = new HtmlWebpackPlugin({
  template: cssPath,
  publicPath: '/',
  filename: cssPath.replace('-template', ''),
  inject: false,
});

const jsWebPackPlugin = new HtmlWebpackPlugin({
  template: jsPath,
  publicPath: '/',
  filename: jsPath.replace('-template', ''),
  inject: false,
});

export default {
  plugins: [cssWebPackPlugin, jsWebPackPlugin],
};
