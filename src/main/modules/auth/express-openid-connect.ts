import openIdConnect from 'express-openid-connect';
import type { ConfigParams } from 'express-openid-connect';

const { auth, requiresAuth } = openIdConnect;

export { auth, requiresAuth };
export type { ConfigParams };
