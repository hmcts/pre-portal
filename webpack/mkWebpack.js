import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

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
