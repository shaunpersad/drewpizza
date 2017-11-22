FROM node:boron

# port
# EXPOSE 3000

# initial set up
WORKDIR /usr/src/app
COPY package.json /usr/src/app
RUN npm install --loglevel warn

# copy the app
COPY . /usr/src/app

# start
CMD ["node", "index.js"]
