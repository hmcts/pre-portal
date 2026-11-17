import * as express from 'express';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpack from 'webpack';

let webpackConfigPromise: Promise<any> | null = null;
async function getWebpackConfig() {
  if (!webpackConfigPromise) {
    webpackConfigPromise = import('../../webpack.config.js').then(m => m.default || m);
  }
  return webpackConfigPromise;
}

export const setupDev = async (app: express.Express, developmentMode: boolean): Promise<void> => {
  if (!developmentMode) return;
  const webpackconfig = await getWebpackConfig();
  const compiler = webpack(webpackconfig);
  if (!compiler) {
    throw new Error('Webpack compiler could not be created. Check your webpack configuration.');
  }
  app.use(
    webpackDevMiddleware(compiler, {
      publicPath: '/',
    })
  );
};
