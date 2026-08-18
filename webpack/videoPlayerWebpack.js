import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./videoPlayerWebpack.cjs');

export default config;
