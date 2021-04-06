## User roles
In this part of the project analysis, different user roles and their permissions are being described.
### 👤 User
Standard user role, accessing the service through a conventional (modern) web browser. Certain level of web development knowledge is expected (basics of HTML and CSS). Knowledge of Playwright is not required, although useful when defining custom actions.

#### Solution requirements
- the solution shall enable user to record their action in the streamed Playwright environment
- the solution shall export the recorded actions as a Playwright script after recording (when requested) 
- during the recording, the solution shall allow user to edit the code manually to add custom Playwright actions
- the solution shall be able to replay an existing recording, preferably in a step-by-step (block-coding) manner
- during the playback phase, the solution shall allow user to stop the playback, edit its parts and save this edited recording (or save this as a new file)
- the solution shall be entirely accessible through a conventional modern web browser (Chrome 87+, Firefox 84+) with no need to install any additional software on the client-side.