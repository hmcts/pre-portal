import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./htmlWebpack.cjs');

export default config;
