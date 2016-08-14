FROM nodesource/trusty:6.3.1

RUN mkdir /app
WORKDIR /app
ADD package.json /app/
RUN npm install

ADD src /app/src
ADD config /app/config
ADD template /app/template
ADD static /app/static

EXPOSE 10000

CMD ["node", "src/index.js"]
