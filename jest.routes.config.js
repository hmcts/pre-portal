import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./jest.routes.config.cjs');

export default config;
