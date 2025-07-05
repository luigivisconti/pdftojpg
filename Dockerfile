# Immagine base con Node.js e apt
FROM node:20-slim

# Crea cartella app
WORKDIR /app

# Installa Poppler
RUN apt-get update && \
    apt-get install -y poppler-utils && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copia package.json e installa le dipendenze
COPY package*.json ./
RUN npm install

# Copia tutto il progetto
COPY . .

# Espone la porta
EXPOSE 3000

# Comando di avvio
CMD ["node", "index.js"]