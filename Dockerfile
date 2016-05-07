FROM mhart/alpine-node:5.11.1

RUN mkdir /app
WORKDIR /app
ADD package.json /app/
RUN npm install

ADD src /app/src
ADD config /app/config
ADD template /app/template
ADD static /app/static

EXPOSE 10000

CMD ["node", "--harmony_destructuring", "--harmony_default_parameters", "src/index.js"]
