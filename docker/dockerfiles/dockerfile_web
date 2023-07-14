FROM node:18.11.0

WORKDIR /app

RUN git clone https://github.com/Helicone/helicone.git
WORKDIR /app/helicone/web
RUN yarn

EXPOSE 3000

RUN yarn build

CMD [ "yarn", "start" ]
