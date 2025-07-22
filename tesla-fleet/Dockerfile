FROM node:24-slim

#1) Install OS CA tools
RUN apt-get update && apt-get install -y ca-certificates

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

# 3) Add the proxy’s cert into the system trust store
COPY config/tls-cert.pem /usr/local/share/ca-certificates/tls-cert.pem
RUN update-ca-certificates

RUN npm run build

EXPOSE 3000

CMD [ "npm", "run", "dev"] 