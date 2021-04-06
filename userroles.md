## User roles
In this part of the project analysis, different user roles and their permissions are being described.
### 👤 User
Standard user role, accessing the service through a conventional (modern) web browser. \
Certain level of web development knowledge is expected (basics of HTML and CSS). Knowledge of *Playwright* is not required, although useful when defining custom actions.

#### Typical usage
This user role is expected to use this tool to generate *Playwright* code snippets without the need to install *Playwright* (or any other software) in their own environment.

#### Solution requirements
The following points sum up the client's requirements for the solution in a priority-ordered manner.

##### 🔥 Crucial
- the solution shall enable user to record their actions in the streamed *Playwright* environment
- the solution shall export the recorded actions as a *Playwright* script after recording (when requested) 
- during the recording, the solution shall allow user to edit the code manually to add custom *Playwright* actions
- the solution shall be able to replay an existing recording
- the solution shall be entirely accessible through a conventional modern web browser *(Chrome 87+, Firefox 84+ and similar)* with no need to install any additional software on the client-side.

##### ❗ Important
- during the recording phase, the solution shall record the actions in a "block-coding" manner ("click", "open URL" etc.) to allow for simple and user-friendly code manipulation.
- during the playback phase, the solution shall allow user to stop the playback, edit its parts and save this edited recording (or save this as a new file)

##### ❕ Nice to have
- the solution shall allow user to replay the code in step-by-step fashion (according to the "code blocks" from the previous point)
