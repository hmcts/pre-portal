# ---- Base image ----
FROM hmctspublic.azurecr.io/base/node:20.15-alpine as base
USER root
RUN corepack enable
COPY --chown=hmcts:hmcts . .
USER hmcts
# ---- Build image ----
FROM base as build
RUN yarn --version && yarn install
RUN yarn build:prod

# ---- Runtime image ----
FROM build as runtime
RUN rm -rf webpack/ webpack.config.js
COPY --from=build $WORKDIR/src/main ./src/main
RUN yarn build:ts

EXPOSE 4551
