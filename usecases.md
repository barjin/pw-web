## Use case analysis
In this part of the project analysis, I describe possible use cases and workflows.

### Creating a new recording
When recording a new code snippet, the user interacts with the streamed *Playwright* environment, which results in generating the code snippet.
- After startup, the user is in the **Main Menu**, where they can see their existing recordings. By clicking the "New Recording" button, the user enters the **Snippet Detail Screen**.
- The **Snippet Detail Screen** is vertically divided into two parts: *Code* and *Playwright Environment*. The *Code* part is where the generated code will appear, in the "Playwright environment" section, there is a styled text input field.
- By entering a valid URL into the aforementioned input field and submitting, the user starts a new Playwright recording session.
- During the recording phase, there is an HTML5 canvas in the "Playwright environment" section, receiving the Playwright video stream. By interacting (clicking, typing) with this canvas, the user sends commands to the Playwright running on the server, which then generates the Playwright code and streams the current state of the browser to the canvas.
- The generated code appears in the *Code* section of the screen, preferably in the "block coding" manner.
- By clicking the *Stop recording* button in the uppermost part of the *Code* section, the server stops streaming the Playwright environment and allows user to edit, debug or save the generated code.

### Playing an recording
After recording a code snippet, the user can replay the recording to review it.
- The user can either pick the recording from the **Main Menu** screen or stay on the **Snippet Detail Screen** after recording a new snippet. 
- On the **Snippet Detail Screen** in the uppermost part of the *Code* section, there is a *Control bar* with *Play*, *Pause*, *Step* and *Settings* buttons. 
    - Clicking the *Settings* button opens a context menu with *Delay* setting. By editing this value, the user sets the delay before running each "code block command". 
- By clicking the *Play* button, the user signals the intent to play the code snippet. The server starts a new Playwright session and runs the commands in the *Code* section, interleaved with delays of the specified length.
- During the playback phase, user can click the *Pause* button, which halts the current playback.
- By clicking the *Step* button, the user sends a signal to execute the current pending command. If the Playwright session is inactive, a new Playwright session is spawned and the command is executed.

### Editing a recording
After recording a code snippet, the user can edit its parts to achieve the expected behaviour.
- On the **Snippet Detail Screen**, clicking any of the generated code blocks (in the *Code* section) opens a modal pop-up window with a textarea field containing the generated code, which the user can edit. 
- Furthermore, at the bottom of the *Code* section, there is a *New Block* button. Clicking this button also opens a modal pop-up window with empty textarea field, where the user can enter their own custom code.
- User can rearrange the code blocks by left-click-dragging them. 
- By clicking the "X" button in the top-right corner of the code block, the user removes this block from the *Code* section.

### Managing the recordings
The user can also manage (rename, delete) the existing recordings.
- In the **Main Menu** screen while selecting the recording, there is a "hamburger menu" icon in the top-right corner of each recording's button. Clicking this icon opens a dropdown menu with options to *Rename* and *Delete* the affected recording.
- When selecting *Delete* from the dropdown menu, the service asks the user to confirm their decision by opening a modal alert "Are you sure?" window.