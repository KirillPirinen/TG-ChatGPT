FROM node:18.4.0
EXPOSE 3000
COPY ./ ./
RUN wget -qO - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/googlechrome-linux-keyring.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/googlechrome-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | tee /etc/apt/sources.list.d/google-chrome.list && \
    apt-get update && \
    apt-get install -y xvfb google-chrome-stable
RUN npm i pm2 -g && npm ci && npm run build 
CMD xvfb-run --server-args="-screen 0 1024x768x24" pm2-runtime dist/index.js 
