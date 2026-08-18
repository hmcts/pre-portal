import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./webpack.config.cjs');

export default config;
