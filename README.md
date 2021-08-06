# PWww 🎭🌐
An intuitive web interface for [Playwright](https://github.com/microsoft/playwright). Implemented using Node.js and React.

## Downloads
- "Official" releases under [Tags](https://github.com/barjin/pw-web/tags).
- Latest commit builds as job artifacts under [Actions](https://github.com/barjin/pw-web/actions).
- [Tampermonkey Selector Generator/Tester (deprecated, not updated anymore)](https://github.com/barjin/pw-web/raw/development/pwww-server/tools/tampermonkey/tm_script.user.js).

## How to run
- The easiest way to run Pwww is to use the official Docker image, [`barjin/pw-web`](https://hub.docker.com/r/barjin/pw-web). By default, this Docker image exposes ports 8000 (HTTP/TCP), 8080 and 8081 (WebSockets/TCP) and those need to be mapped when starting the container using `docker run -d -p 8080:8080 ... barjin/pw-web`.

## Documentation
All the documentation can be found on the corresponding [GitHub Page](https://barjin.github.io/pw-web/).

## Legal
Made in collaboration with [Apify](https://apify.com/) as an Individual Software Project at [MFF UK](https://www.mff.cuni.cz/), 2021.\
Supervisor [RNDr. Jakub Klímek, Ph.D.](https://jakub.klímek.com/).
