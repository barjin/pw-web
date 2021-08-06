# PWWW Dockerfile

FROM node:16-alpine

EXPOSE 8000/tcp
EXPOSE 8080/tcp
EXPOSE 8081/tcp

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN apk add --no-cache chromium 

COPY "pwww-bundle.zip" "/root"
# Unzip and install dependencies
RUN cd \
    && unzip "pwww-bundle.zip" \
    && cd "src" \
    && npm install .

ENTRYPOINT ["node","/root/src/pwwwServer.js"]