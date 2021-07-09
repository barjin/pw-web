# Server API through WebSockets
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
    "data":{"x": click x-coordinate, "y": click y-coordinate}
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
- `playRecording`
```
    ...
    "data":{(optional) "delay": (number - length of delay between actions during playback in ms)}
}
```
- `recording`
```
    ...
    "data":{"on": (true|false - turn the recording session on/off)}
}
```
- `openTab`
```
    ...
    "data":{} // no content is read from data field
}
```
#### Server -> client messages
Server can update client on state changes (now only tab bar updates and recording updates). Server is now treated as the single source of truth and with every update the entire data structure is sent, which is not exactly economical.
Possible messages from server to client are:
- Tab update
```
// Tab update example
{
    "currentTab": 1,              // index of active page in the following array
    "tabs":["Page #1", "Page #2"] // titles of currently open pages 
}
```
- Recording update (sent when a new action is recorded)
```
{
// Recording example
    "recording":[   // Array of Where-What pairs
        {
            "where":{}, // Currently not in use 
            "what":{"type":"openTab","data":{}} // Corresponding to the client-invoked action
        },
        {
            where:
            ...
        },
        ...
    ]
}
```
Format of the recorded action (where-what pair) is also specified in [types.ts](https://github.com/barjin/pw-web/blob/development/backend/src/types.ts) under type *RecordedAction*.