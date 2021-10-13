FROM node:12-alpine
WORKDIR /var/www/calendar
ADD . /var/www/calendar
RUN yarn install
EXPOSE 3100
CMD yarn start
