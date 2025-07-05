FROM node:20-slim

WORKDIR /app

# Installa Poppler e pulizia
RUN apt-get update && \
    apt-get install -y poppler-utils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["node", "index.js"]
