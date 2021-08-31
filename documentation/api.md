# Recording management REST API
The REST API has it's OpenAPI 3.0.0 compliant specification in the [yaml file](devdocs/openapi.yaml).
# Executor API over WebSockets
PWWW server uses *WebSockets* to transmit user actions and screencast between client and server. It utilizes two distinct WS channels (is listening on two ports) to separate binary image screencast data (default port 8081) and textual commands and state updates (default port 8080).
## Basics
Server part of the application uses simple logic to manage active browser sessions using the active WebSocket connections. By default, maximum of 5 simultaneous active browser sessions is allowed, this can be overriden by setting the enviroment variable PWWW_MAX_SESSIONS to a different value.

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