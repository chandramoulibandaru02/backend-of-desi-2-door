FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN mkdir -p uploads/products
EXPOSE 5000
CMD ["node", "server.js"]
