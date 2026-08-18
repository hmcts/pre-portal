import * as express from 'express';
import webpack from 'webpack';
import webpackDev from 'webpack-dev-middleware';
import webpackconfig from '../../webpack.config.cjs';

export const setupDev = (app: express.Express, developmentMode: boolean): void => {
  if (developmentMode) {
    const compiler = webpack(webpackconfig);
    app.use(
      webpackDev(compiler, {
        publicPath: '/',
      })
    );
  }
};
