FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY src/ src/
COPY public/ public/
COPY migrations/ migrations/
COPY .pgmigraterc.js .
EXPOSE 3000
CMD ["sh", "-c", "npm run migrate:up && node src/index.js"]
