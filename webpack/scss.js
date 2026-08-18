import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./scss.cjs');

export default config;
