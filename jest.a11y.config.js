import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./jest.a11y.config.cjs');

export default config;
