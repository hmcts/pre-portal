import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./mkWebpack.cjs');

export default config;
