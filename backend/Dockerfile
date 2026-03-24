FROM node:20-alpine
WORKDIR /app

COPY package.json .
RUN npm install --omit=dev

COPY src/ src/

# File cache directory
RUN mkdir -p data

EXPOSE 3001
CMD ["node", "src/app.js"]
