FROM helicone/helicone-base as base

FROM node:18.11.0

COPY --from=base /srv/helicone/worker /srv/worker

WORKDIR /srv/worker

RUN npm install -g wrangler
RUN npm install

EXPOSE 8787

CMD ["wrangler", "dev", "--local"]