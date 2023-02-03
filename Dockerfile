FROM node:18.4.0

RUN wget http://download.redis.io/redis-stable.tar.gz && \
    tar xvzf redis-stable.tar.gz && \
    cd redis-stable && \
    make && \
    mv src/redis-server /usr/bin/ && \
    cd .. && \
    rm -r redis-stable && \
    npm install -g concurrently   

EXPOSE 6379

WORKDIR /app

EXPOSE 3000

EXPOSE 6379

COPY ./ ./

RUN npm i pm2 -g && npm ci && npm run build 
CMD concurrently "/usr/bin/redis-server --bind '0.0.0.0'" "sleep 5s; pm2-runtime dist/index.js"
