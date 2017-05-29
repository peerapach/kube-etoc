FROM node:6.10.3-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
RUN ls -lR
COPY app.js package.json /usr/src/app/
COPY test/* /usr/src/app/test/
COPY ssl/* /usr/src/app/ssl/

RUN npm install

EXPOSE 3000
CMD [ "npm", "start" ]
