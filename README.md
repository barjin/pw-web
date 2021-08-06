# PWww 🎭🌐
An intuitive web interface for [Playwright](https://github.com/microsoft/playwright). Implemented using Node.js and React.

## Downloads
- "Official" releases under [Tags](https://github.com/barjin/pw-web/tags).
- Latest commit builds as job artifacts under [Actions](https://github.com/barjin/pw-web/actions).
- [Tampermonkey Selector Generator/Tester (deprecated, not updated anymore)](https://raw.githubusercontent.com/barjin/pw-web/development/backend/tools/tampermonkey/tm_script.user.js).

## How to run
- The easiest way to run Pwww is to use the included Dockerfile, build it (in a folder containing pwww-bundle.zip as well) using `docker build -t barjin/pw-web .` and run it. By default, this Docker image exposes ports 8000 (HTTP), 8080 and 8081 (WebSockets) (needs to be addressed when running using `docker run -it -p 8080:8080 ...`).

## Documentation
All the documentation can be found on the corresponding [GitHub Page](https://barjin.github.io/pw-web/).

## Legal
Made in collaboration with [Apify](https://apify.com/) as an Individual Software Project at [MFF UK](https://www.mff.cuni.cz/), 2021.\
Supervisor [RNDr. Jakub Klímek, Ph.D.](https://jakub.klímek.com/).
