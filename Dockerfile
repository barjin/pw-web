# PWWW Dockerfile

FROM node:16-alpine

EXPOSE 8000/tcp
EXPOSE 8080/tcp
EXPOSE 8081/tcp

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1
ENV CHROMIUM_PATH /usr/bin/chromium-browser

RUN apk add --no-cache chromium 

WORKDIR /root

COPY "checkForUpdates.js" "."
COPY "run.sh" "."
# RUN mkdir dataStore	
# COPY "dataStore" "./dataStore"

RUN chmod +x ./run.sh

ENTRYPOINT ["sh", "./run.sh"]