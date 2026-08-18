import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./jest.smoke.config.cjs');

export default config;
