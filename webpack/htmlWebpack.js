import path from 'node:path';
import { fileURLToPath } from 'node:url';
import HtmlWebpackPlugin from 'html-webpack-plugin';

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
