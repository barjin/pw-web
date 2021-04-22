## Design
In this part, I elaborate on the UI design of the application.
### Main Menu
![Main Menu Mockup (courtesy of Apify)](.img/menu_design.png)
After startup, the user is in the *Main Menu*, where they can see a list of their existing recordings. By clicking any of the recordings, the user is taken to the *Snippet Detail Screen*. By clicking the *New Recording* button, the user is taken to the *Snippet Detail Screen* as well (a blank one).

### Snippet Detail Screen
![Snippet Detail Screen (courtesy of Apify, modified)](.img/recording_design.png)
The **Snippet Detail Screen** is the main window of the entire application, as the recordings are being made and edited here.
- This screen is vertically divided into two parts: *Code* and *Playwright Environment*. 
- The *Code* part is where the generated code appears, in the uppermost part of the *Code* section, there is also a *Control bar* with *Play*, *Pause*, *Step* and *Settings* buttons. 
    - Clicking the *Settings* button opens a context menu with *Delay* setting. By editing this value, the user sets the delay before running each "code block command". 
    - At the bottom of the *Code* section, there is a *New Block* button. Clicking this button also opens a modal pop-up window with empty textarea field, where the user can enter their own custom code.
- In the *Playwright Environment* section, there is an HTML5 canvas, receiving the Playwright video stream. \
By interacting with this canvas (clicking, typing with the canvas in focus), the front-end application sends these events to the Playwright session on server (preferably using *WebSockets* to ensure reliable, low overhead communication).
    - During the recording/playback session, server streams a screencast of the Playwright session to the client app (using binary transmission over *WebSockets*, *WebRTC* or *DASH/HLS*. For simplicity and sturdiness, the *DASH* solution is preferable, as it does not involve low-level manipulation with data and is well documented, however for low latency, which is crucial in this application, the *WebRTC* approach is much more suitable. 