FROM node:18-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --silent
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
