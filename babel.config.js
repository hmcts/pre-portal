import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./babel.config.cjs');

export default config;
