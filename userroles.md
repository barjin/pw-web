## User roles
In this part of the project analysis, different user roles and their permissions are being described.
### 👤 User
Standard user role, accessing the service through a conventional (modern) web browser.

#### Permissions
- can interact with the streamed Playwright environment
- inside the Playwright environment, user can record their actions and save these recordings, as well as rename and remove them
- can edit the generated code (in both text and "block" manner)
- can replay the generated code
- can debug the generated code in a step-by-step manner
#### Limitations
- the system shall employ a time limit for user-made code snippets to avoid excessive hardware usage or other malicious intents
- the system shall limit the code size per user-made snippet (and number of saved snippets) to avoid excessive disk usage

### 👩‍💻 Administrator
An elevated user role with a broader spectrum of permissions.
#### Permissions
- all the basic [user permissions](#user)
- reviews the user-generated content 
- recieves notifications about the limit-exceeding code snippets, can manually verify user-made code and allow its execution