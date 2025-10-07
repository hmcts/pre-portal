import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootExport = require.resolve('govuk-frontend');
const root = path.resolve(rootExport, '..');
const sass = path.resolve(root, 'all.scss');
const javascript = path.resolve(root, 'all.js');
const components = path.resolve(root, 'components');
const assets = path.resolve(root, 'assets');
const images = path.resolve(assets, 'images');
const fonts = path.resolve(assets, 'fonts');

const patterns = [
  { from: images, to: 'assets/images' },
  { from: fonts, to: 'assets/fonts' },
  { from: `${assets}/manifest.json`, to: 'assets' },
  { from: `${root}/template.njk`, to: '../views/govuk' },
  { from: `${root}/components`, to: '../views/govuk/components' },
  { from: `${root}/macros`, to: '../views/govuk/macros' },
];

export default {
  paths: { template: root, components, sass, javascript, assets },
  patterns,
};
