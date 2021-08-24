# PWWW User documentation
Thank you for choosing PWWW as your Playwright code generator! In the following document, you will find everything you need to get started with PWWW. 
# Installation
To run PWWW, we first need to run the server (if someone has setup the server for you, you can skip to the [First Steps part](./#first-steps)).
The server setup is quite simple, the easiest solution is to use the official Docker image [`barjin/pw-web`](https://hub.docker.com/repository/docker/barjin/pw-web).
To run this Docker image, execute following commands in the shell of your choice:
```
    docker pull barjin/pw-web
    docker run -t -p 8000:8000 -p 8080:8080 -p 8081:8081 barjin/pw-web
```
The container should start, pull the freshest version of PWWW right from the GitHub repository and run it.
## Possible complications
- There is something already running at these ports of your server. Sadly, as of now, ports used by PWWW cannot be remapped. Please, terminate the other process and start the container again.
- The newest version of PWWW cannot be downloaded. Please, check your internet connection and try again. In case you modified the source files in the container, revert these changes (or start a new container).
# First steps
After starting the server, the PWWW user interface is available at [http://localhost:8000](http://localhost:8000).
- On the initial page (*Main menu*), you can find all existing recordings (there are some recordings already included in the Docker image, to show PWWW's capabilities). Create a new recording by clicking the "New recording" button.
- After creating the new recording, you can open it by clicking its name in the Main menu. This takes you to the *Recording Screen*.
- The recording screen is horizontally divided into two parts. In the left part you will find all the recording related controls, as well as the generated code (we'll get to that later). In the right part of the screen, there is your streamed browser session. Try typing something in the address bar! You can also use this streamed browser as your regular web browser. If you need to input text, use the "Insert text" link above the "browser window". 
- The PWWW's main feature is recording browser actions. Let's try this - click the "Start Recording" button in the upper left part of your screen. If you have any webpages open, they will get closed, as we need to start the recording with a blank canvas. If the recording session has started properly, a small red pulsating circle will show up in the recording section, indicating recording-in-progress.
- Now, use the streamed browser as usual again. You will see the actions you make appear in the "Code" section of your screen. All the supported actions are:
    - browsing to URLs (using the address bar)
    - clicking
    - stack navigation (going back and forth using the arrow buttons next to the address bar)
    - typing text
    - opening new tab, closing a tab, switching tabs
- After finishing your recording, stop the recording session using the "Stop recording" button.
- Now you can review your recording. Using the "Play" button, you start the recording playback. Watch out, some actions (e.g. browsing to content heavy webpages) can take long time. If there are any errors, PWWW will stop the playback and tell you.
## Possible complications
- In rare cases, the click action will act "unpredictably" - i.e. clicking other elements, not clicking at all etc. 
    - This is because of the PWWW's double-checking feature - after clicking the element (button, link, paragraph) on a webpage, PWWW will first generate the element's *selector* - a short string describing the element. 
    - Then, PWWW will try to click the element matching this selector - this is exactly what PWWW does when playing the recording. This way, during the recording phase, you will see the same actions PWWW will carry out later during playback.
    - If the generated selector was not specific enough, it can get matched with another element - which can cause this kind of a problem. In other cases, the webpage is way too dynamic and the generated selectors do exist in the second run.
    - Unfortunately, some webpages can get really complicated, which makes it difficult for the selector generator to work properly sometimes. 
    - If you encounter this kind of an error, try taking another path to your goal. Browsing using the address bar as far as you can (and relying on the click actions less) tends to work pretty well.
# Going pro
While being very useful for e.g. testing user workflows on different pages, the use cases for PWWW might now seem a little limited. Here are some tips to get the best out of your instance of PWWW.
## Exporting
    - Using external services (like [Apify](https://apify.com/)) or running the generated code in your own node.js installation is fairly simple - click the "Export" button in the upper left corner of the recording screen, select your environment and download the executable .js file.
## Outputs
    - Sometimes, you would like to create an automated workflow to extract some data from a web page. PWWW can record "read" action, which reads text content of the specified element. The read action is invoked using the *right mouse button* on the element you want to read. Using the recording (and playback) functionality of PWWW, read action is NOOP (has no effect) and works only when the code is exported.
    - Similarly, right-clicking an image element will take a screenshot of it. Pressing the `S` key will take screenshot of the whole page. Just like read action, screenshot is NOOP in PWWW.
## Editing actions
    - On the recording page, the recording can be edited:
        - By double-clicking the code block, an edit modal will show up. 
        - By clicking the red cross in the upper right corner of a code block, the code block can be removed from the recording.
        - The actions in the recording can be reordered in drag-and-drop manner.
## Custom code
    - When the recording session is inactive, user can add custom code blocks to the recording by clicking the "Custom code block" button at the end of the recording. The newly generated block can be then edited by double-clicking it. 
    - This custom code is run inside of the streamed browser and it has access to regular browser js environment.
    - PWWW employs internal time limits for the custom code execution (5000 ms as of now). When this limit is reached, PWWW will reload the current page, stopping the script execution (this is mainly to deal with possible infinite loops and to prevent service expoitation). These limits are not passed into the exported code.
### Possible complications
- Just like clicking, the read action uses generated selectors (which are a little different here, but still). Similar problems with selector ambiguity can happen.
- Reordering your recording and/or deleting certain actions can break recording's flow due to causality, proceed with care!
- Tab-related actions are not getting exported to the executable .js files, mainly due to the dynamic nature of popup windows. If your recording uses this feature, it probably will not work correctly during the compiled playback.