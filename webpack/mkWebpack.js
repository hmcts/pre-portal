import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootExport = require.resolve('@mediakind/mkplayer');
const root = path.resolve(rootExport, '..');

const patterns = [
  { from: `${root}/mkplayer.js`, to: 'assets/js' },
  { from: `${root}/mkplayer-ui.css`, to: 'assets/css' },
];

export default {
  paths: { template: root },
  patterns,
};
