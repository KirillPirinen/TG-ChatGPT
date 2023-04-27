FROM ubuntu:latest

USER root

RUN apt-get update
RUN apt-get -y install curl gnupg tar wget make gcc g++
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs

RUN wget http://download.redis.io/redis-stable.tar.gz && \
    tar xvzf redis-stable.tar.gz && \
    cd redis-stable && \
    make && \
    mv src/redis-server /usr/bin/ && \
    cd .. && \
    rm -r redis-stable && \
    npm install -g concurrently && \
    npm install pm2 -g

EXPOSE 3000

EXPOSE 6379

COPY . .

RUN npm ci 

RUN npm run build

# COPY --from=auth /goapp/OpenAIAuth/auth /app/dist

CMD concurrently "/usr/bin/redis-server --bind '0.0.0.0'" "sleep 5s; npm run start"
