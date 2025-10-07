import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let MiniCssExtractPlugin;
try {
  // Try root export
  const mod = require('mini-css-extract-plugin');
  MiniCssExtractPlugin = mod.default || mod;
} catch (eRoot) {
  try {
    const altPath = require.resolve('mini-css-extract-plugin/dist/index.js');
    const mod2 = require(altPath);
    MiniCssExtractPlugin = mod2.default || mod2;
  } catch (eDist) {
    throw new Error(`Unable to resolve mini-css-extract-plugin: root error: ${eRoot.message}; dist error: ${eDist.message}`);
  }
}

const devMode = process.env.NODE_ENV !== 'production';
const fileNameSuffix = devMode ? '-dev' : '.[contenthash]';
const filename = `[name]${fileNameSuffix}.css`;

const miniCss = new MiniCssExtractPlugin({ filename, chunkFilename: '[id].css' });

export default {
  rules: [
    {
      test: /\.scss$/,
      use: [
        'style-loader',
        {
          loader: MiniCssExtractPlugin.loader,
          options: { esModule: false },
        },
        { loader: 'css-loader', options: { url: false } },
        {
          loader: 'sass-loader',
          options: { sassOptions: { quietDeps: true } },
        },
      ],
    },
  ],
  plugins: [miniCss],
};
