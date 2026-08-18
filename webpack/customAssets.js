import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./customAssets.cjs');

export default config;
