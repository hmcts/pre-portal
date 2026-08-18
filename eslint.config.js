import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./eslint.config.cjs');

export default config;
