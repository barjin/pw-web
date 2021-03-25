## User roles
In this part of the project analysis, different user roles and their permissions are being described.
### 👤 User
A standard user, accessing the service through a conventional (modern) web browser.
- can interact with the streamed Playwright environment
- inside PW, user can record their actions and save these recordings, rename and remove them
- can edit the generated code (in both text and "block" manner)
- can replay the generated/written code
    - the system shall employ a limit for user-made code snippets to avoid excessive hardware usage

### 👩‍💻 Administrator
An elevated user role with a broader spectrum of permissions.
- inherits all the user permissions
- reviews the user-generated content (recieves notifications about the limit-exceeding code snippets)
- etcetcetc...