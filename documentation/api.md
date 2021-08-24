# Recording management REST API
The HTTP part of the server, implemented in [Express.js](https://expressjs.com/) uses REST API for recording management. This API uses following endpoints:
- `GET` /api/recordings
    - Lists all recordings available on the server as a JSON list.
    - Example response: 
        -```{
            ok: true,
            data: [
                {
                    id: 0,
                    name: "Recording #1",
                    createdOn: "2021-08-19T12:28:42.246Z"
                },...
            ]
        }```
- `GET` /api/recording?id=*RECORDING_ID*
    - Returns the requested recording as a JSON object. Returns `{ok: false, data: "Reason"}` in case of invalid ID etc.
    - Example response (request to `/api/recording?id=0`): 
        -```{
        {
            "ok":true,
            "data": {
                "name":"Recording #1",
                "actions":[
                    {"type":"browse","data":{"url":"https://www.xyz.com"}},
                    {"type":"click","data":{"x":546,"y":3642,"selector":"A:has-text(\"Link\")"}},
                    ...
                ]
            }
        }
        ```
- `POST` /api/newRecording
    - Creates a new empty recording on the server.
    - Example request body: 
        -```
            {
                name: "New Recording name"
            } 
        ```
    - Example response: 
        -```
            {ok: true} //if the new recording is created
        ```
        -```
            {ok: false, data: "Reason"} //if the an error has occured. Further information about the error is in the "data" field.
        ```
- `POST` /api/renameRecording
    - Renames an existing recording.
    - Example request body: 
        -```
            {
                id: 2,
                newName: "Better name for this recording"
            } 
        ```
    - Example response: 
    -```
        {ok: true} //in case of error, see previous examples.
    ```
- `POST` /api/deleteRecording
    - Deletes an existing recording from the server. Irreversible!
    - Example request body: 
    -```
        {
            id: 2
        } 
    ```
    - Example response: 
    -```
        {ok: true} //in case of error, see previous examples.
    ```
- `POST` /api/updateRecording
    - Updates the contents of an existing recording. Effectively saves (or overwrites) the file with specified name (`name`) and contents (`actions`) as JSON to the server recording storage.
    - Example request body: 
    - ```
    {
        name: "recordingName"
        actions: [
            //see GET /api/recording for the recording format.
        ]
    }
    ```
# Executor API over WebSockets
PWWW server uses *WebSockets* to transmit user actions and screencast between client and server. It utilizes two distinct WS channels (is listening on two ports) to separate binary image screencast data (default port 8081) and textual commands and state updates (default port 8080).
## Basics
Server part of the application uses helper class WSChannel, which simplifies WebSockets management. This class allows only one active connection per server, rejecting all other connection attempts.

Client part (React App) uses standard inbuilt WebSocket API (class WebSocket).
## Recognized commands
The "binary" screencast channel (default port 8081) is effectively unidirectional (only sending data from server to client, with NOOP listener on the server side). All the following commands are therefore recognized by server only when recieved through the command channel (default port 8080).
### Actions
All command/state channel messages are valid JSON objects.
#### Client -> Server messages
Client-invoked actions (clicking, tab switching, browsing) are represented with messages of this format (specified in [types.ts](https://github.com/barjin/pw-web/blob/development/backend/src/types.ts) under *Action*):
```
{
    "type" : "click|switchTabs|openTab|recording|closeTab...",
    "data" : *("type" dependent field)*
}
```
Supported values for the "type" field are all specified in [types.ts](https://github.com/barjin/pw-web/blob/development/backend/src/types.ts) in enum *BrowserAction*.
The "data" field holds action dependent data, i.e.:
- `click`
```
    ...
    "data":{"x": click x-coordinate, "y": click y-coordinate, "selector?": (string - optional, if present, overrides coordinates)}
}
```
- `browse`
```
    ...
    "browse":{"url": "url to browse to"}
    // (if browsing fails due to invalid url, DuckDuckGo search is performed)
}
```
- `navigate`
```
    ...
    "data":{"back": (true - go backwards | false - go forward)}
}
```
- `switchTabs`
```
    ...
    "data":{"currentTab": (number - index of the new active tab)}
}
```
- `closeTab`
```
    ...
    "data":{"closeTab": (number - index of the tab to be closed)}
}
```
- `insertText`
```
    ...
    "data":{"text": (string - text to be pasted)}
}
```
- `reset`
```
    ...
    "data":{}
}
```
- `screenshot`
```
    ...
    "data":{"selector?": (string - optional, if present, screenshot of specified element is taken; if not, screenshot of the whole page gets taken)}
}
```
- `noop`
```
    ...
    "data":{}
}
```
#### Server -> client messages
Server can update client on state changes (now only tab bar updates and recording updates).
Possible messages from server to client are:
- Tab update
```
// Tab update example
{
    "currentTab": 1,              // index of active page in the following array
    "tabs":["Page #1", "Page #2"] // titles of currently open pages 
}
```
Format of the recorded action is also specified in [types.ts](https://github.com/barjin/pw-web/blob/4143461f732bac69ab4438eb4fcbf646e01b39b2/pwww-shared/types.ts) under type *Action*.