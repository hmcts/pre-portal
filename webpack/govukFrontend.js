import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const config = require('./govukFrontend.cjs');

export default config;
