# Introduction
Thank you for choosing PWWW! In this document, I will assume you are a developer, wanting to extend PWWW and make it even more powerful; after all, you went to the technical documentation website. 
Let's see how PWWW operates on the inside and explain some mechanisms and design decisions in the process.

# Docker container and updating 
If you ever tried to run PWWW, you probably used the official Docker container, which makes the initial setup much less painful. The initial image for the container is `node:16-alpine` - an Alpine Linux image with Node.js 16 preinstalled. During the Docker build process, the Chromium browser gets installed, the bootstrapping scripts ([checkForUpdates.js](https://github.com/barjin/pw-web/blob/development/checkForUpdates.ts) and [run.sh](https://github.com/barjin/pw-web/blob/development/run.sh)) get copied into the image and the initial folder structure with the default recordings gets created. All about this process can be found in the [Dockerfile](https://github.com/barjin/pw-web/blob/development/Dockerfile). \
\
The entrypoint (the first piece of PWWW's code, which gets run) of the container is a shell script called [`run.sh`](https://github.com/barjin/pw-web/blob/development/run.sh).
## `run.sh`
This is a shell script (running well in the implicit Alpine Linux's shell) running the auto updater (checkForUpdates.js). If this updater downloads a new version of PWWW, the shell scripts unzips the file and installs all the JS dependencies using npm. Finally, the script runs the executable [pwwwServer.js](https://github.com/barjin/pw-web/blob/development/pwww-server/src/pwwwServer.ts) in the Node.js environment.
## `checkForUpdates.ts`
Script checking the newest version of PWWW from the GitHub actions artifacts (using GitHub API and [nightly.link](https://nightly.link/) for link generation and `wget` for file download). If a new version of PWWW gets downloaded, it exits with exit code 1 (telling the `run.sh` to unzip the new file).

# Server
The initial server script is [pwwwServer.js](https://github.com/barjin/pw-web/blob/development/pwww-server/src/pwwwServer.ts), which (if all the dependencies are met) runs the server instance.
## `pwwwServer.ts`
Is executable in the Node.js environment, accepts arguments (using the yargs parser). Running the script spawns a new instance of the PWWWServer class, which starts two WebSocket servers (one for commands and one for the image transfer) and a [HTTP server](https://github.com/barjin/pw-web/blob/development/pwww-server/src/http-server/server_v2.ts).
\
Also implements the pairing between WS connections and [BrowserSession](https://github.com/barjin/pw-web/blob/development/pwww-server/src/browserSession.ts) instances, and handles session management.
## `server_v2.ts`
PWWW's internal HTTP server, serving the frontend app and the REST API. Uses [Express.js](https://expressjs.com/) as a HTTP server framework.
## `browserSession.ts` 
Contains implementation of the BrowserSession class - this class holds its internal Playwright browser instance, exposes its certain functions and adds business logic (e.g. by spawning [TabManager](https://github.com/barjin/pw-web/blob/development/pwww-server/src/tabManager.ts)) to it for easier access. Accepts commands, sends screenshots and signals through the given WebSocket connections. Default command message handler is `_enqueueTask`, which puts the current client message to an internal queue, from which it gets eventually taken and executed.\
\
Before disposing any BrowserSession object, the `.close()` method must be called! In case of improper disposal, this causes serious memory leak (leaves Playwright browser sessions running).
## `tabManager.ts`
Implements the TabManager class, which servers as a "proxy" between the BrowserSession and Playwright browser and handles tab management (opening new tabs, closing tabs, maintaining the current tab index, popups, bootstrapping initial scripts to the pages etc.).
## `extractSelector.ts`
When passing the click (or read) action to the BrowserSession queue, the selector for the current target must get generated. This is done using an in-browser (as in the internal Playwright session) script called extractSelector. The SelectorGenerator class contains helper functions (`grabElementFromPoint(...)`,`_isUniqueCss(...)`) for facilitating the selector generation, the main function (`getNodeInfo`) then receives an HTMLElement and tries to generate various descriptors for it.\
\
As an experimental feature, some simple linear algebra (namely Markov chains) is used in order to determine, whether a string is human readable (which is benefitial for the selectors, procedurally generated selectors look intimidating to the user and might change over time).

# Frontend
As you might have noticed, the server part of the app works mostly as a thin layer between the Playwright browser session and the WebSocket API. Most of the recording and playback logic is in the frontend app, which also makes it the single source of truth ([SSOT](https://en.wikipedia.org/wiki/Single_source_of_truth)), which is handy for the user,as the recording looks just like they see in their browser. This also makes playback (and stopping, step-by-step etc.) much easier, as it effectively uses the same mechanisms as basic "manual" user-induced browser interaction.\
\
The frontend app is implemented as a React App using typescript.
## `App.tsx`
React App entrypoint, uses React Router for single page browsing between the [Home Screen](https://github.com/barjin/pw-web/blob/development/pwww-web/src/screens/homeScreen.tsx) and the [Recording Screen](https://github.com/barjin/pw-web/blob/development/pwww-web/src/screens/recordingScreen.tsx). 
## `homeScreen.tsx`
Renders the Home Screen with the table of existing recordings. The `RecordingsTable` class holds the current list of recordings in its React state; has methods for recording management (`addNewRecording()`, `deleteRecording()`, `renameRecording()`), uses asynchronous calls to the server's REST API to pass these changes to the server.
## `recordingScreen.tsx`
Renders the Recording Screen for the current recording. When the main class, RecordingScreen, is loaded, it reads the query part of the current url, performs a fetch request to the REST API, downloads the current recording and stores it in its React state. RecordingScreen's React state is therefore the only place where the currently edited recording should be stored to avoid inconsistencies. It also contains the current list of open tabs, making RecordingScreen the SSOT in all contexts. Child components can modify the recording only using RecordingScreens callbacks (stored in `_recordingModifier`, callbacks internally perform REST API calls to modify the recording). Also establishes WS connections to the server and renders SideBar, ToolBar and StreamWindow components and contains implementations for the playback mechanism. (You remember how we said that server is just a thin layer? All the playback functionality is here!)\
\
The StreamWindow component serves as a React compatibility layer for the underlying bare `<canvas>` element, used as the browser window. It has several convenience methods to simplify (mainly) action requesting and scrolling functionality. It uses several callbacks passed from the parent RecordingScreen component to send actions via WebSocket connection and request screenshots when needed - StreamWindow also contains simple logic for optimized screen loading.
## `side_bar.tsx`
Recording screen's child component, renders the side bar with the recorded actions and playback controls. Uses callbacks passed from the RecordingScreen to edit the recording and control the playback. \
\
Also contains definition for the `DownloadModal` modal component, which uses the `jsTranspiler.js`'s exported classes to transpile the recording into executable code.
## `toolbar.tsx`
Toolbar contains TabBar component (list of open tabs), address bar and navigation buttons and passes callbacks passed to it from the RecordingScreen to its children.\
\
TabBar lists all the open tabs, passed as a list through React props to it (the source of this info is the RecordingScreen component, which is still the SSOT for all browser context) and binds some callbacks to the tabs (e.g. for closing or switching tabs).
## `ACKChannel.ts`
ACKChannel is a convenience class used to promisify the communication over WebSocket channel. Internally it uses a simple WebSocket connection and a list of "requested" messages with unique IDs - when an incoming JSON message contains "responseID" field, it tries to find the mathing "request" - if it does, it resolves the related promise. If an incoming message does not contain "responseID" field, it gets processed by the broadcastCallback. The ACK channel class also allows for adding custom listeners to the underlying WS connection (although this should not be overused, as it would defy it's clean promise-friendly interface).

# Transpiling
Exporting executable code should be the last stop in the browser recording workflow. In this step, classes from `jsTranspiler.ts` file are used. The base `Transpiler` class implements the `translate()` function, which accepts a list of Actions and generates an executable .js code, mostly by 1:1 mapping the actions on the specified code lines. This could be seen as trivial and brittle, but in fact, most code generators use this approach, for example see [js code generator](https://github.com/microsoft/playwright/blob/c4eb2d4b1e17a0de1cea7220be45545c7c524614/src/server/supplements/recorder/javascript.ts#L105) used by Playwright's codegen module.

# Where next?
After reading this document, you should have a pretty good idea about PWWW's internal mechanisms. If you want to know more about individual parts, try the [module/class documentation](../devdocs.md), or take a look around in the code (it's written in typescript and contains verbose comments).