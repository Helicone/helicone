FROM helicone/helicone-base as base

FROM node:18.11.0

COPY --from=base /srv/helicone/web /srv/web

WORKDIR /srv/web

RUN yarn

EXPOSE 3000

CMD [ "yarn", "dev" ]