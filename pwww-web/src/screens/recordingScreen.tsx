import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import {Component, createRef} from 'react';

import {ToolBar} from '../components/toolbar';
import {SideBar} from '../components/side_bar';

import querystring from 'querystring';

import {ACKChannel} from '../ACKChannel';
import * as types from 'pwww-shared/types';
import {getAPI, postAPI} from '../restAPI';

import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const VIEWPORT_W = 1280;
const VIEWPORT_H = 720;

/**
 * React component containing the canvas with the streamed browser environment.
 * 
 * Contains all the rendering methods as well as some scrolling logic. 
 */
class StreamWindow extends Component<any, any> {
  /**
   * React Reference to the actual HTML canvas element acting as the browser main window.
   */
  private _canvas : React.RefObject<HTMLCanvasElement>;
  /**
   * Callback function for passing the canvas targetted actions (clicking, screenshots) to the handlers higher up.
   */
  private _actionSender : (...args: any[]) => Promise<void>;
  /**
   * Callback function for requesting new screen tiles - used with the scrolling functionality, not connected to the recordable "screenshot" action.
   */
  private _requestScreenshot : (screenNumber: number) => void;
  /**
   * Current distance scrolled (in the vertical direction).
   */
  private _scrollHeight : number = 0;
  /**
   * Array of screen tiles - updated dynamically as the user scrolls to save some bandwidth as well as some extra horsepower.
   */
  private _screenBuffer : Blob[] = [new Blob([])];
  
  constructor(props: {actionSender : (actionType: types.BrowserAction, data: object) => Promise<void>, screenRequester: (screenNumber: number) => void}){
    super(props);

    this._canvas = createRef();
    this._actionSender = props.actionSender;
    this._requestScreenshot = props.screenRequester;
  }

  /**
   * Canvas click handler using basic geometry to map the current click position (takes care of the scroll height calculations) to the VIEWPORT_H, VIEWPORT_W space (correspoding to the Playwright's browser window size)
   * @param {MouseEvent} ev - Click event
   * @returns The remapped coordinates of the current click.
   */
  private getClickPos = (ev : MouseEvent) => {
    if(this._canvas.current){
      let canvasPos = this._canvas.current.getBoundingClientRect();
      return {
        x: Math.floor((VIEWPORT_W/canvasPos.width)*(ev.clientX - canvasPos.left)), 
        y: Math.floor((VIEWPORT_H/canvasPos.height)*(ev.clientY - canvasPos.top) + this._scrollHeight)
      };
    }
    else{
      return {x: 0, y: 0}
    }
  }

  /**
   * "Setter" function for the internal sceen buffer.
   * @param {number} idx - Index of the new screen being added.
   * @param {Blob} data - Binary image data of the new screen.
   */
  public addScreen(idx: number, data: Blob) : void{
    this._screenBuffer[idx] = data;
    this._flushBuffer();
  }

  /**
   * Clears the screen buffer array and resets the scroll height to 0.
   */
  public resetView(): void {
    this._scrollHeight = 0;
    this._screenBuffer = [];
  }

  componentDidMount = () => {
    if(this._canvas.current){
      let canvas = this._canvas.current;

      canvas.addEventListener('click', (ev) => {
        if(this._canvas.current){
          this._actionSender(types.BrowserAction.click, this.getClickPos(ev))
          .catch(console.error);          
      }});

      canvas.addEventListener('contextmenu', (ev) => {
        this._actionSender(types.BrowserAction.read, this.getClickPos(ev));
        ev.preventDefault();
      });

      canvas.addEventListener('wheel', (ev) => {
          let heightBackup = this._scrollHeight;
          this._scrollHeight += (ev.deltaY * VIEWPORT_H / (this._canvas.current?.height || 1));
          this._scrollHeight = (this._scrollHeight < 0) ? 0 : this._scrollHeight;

          if(this._scrollHeight > ((this._screenBuffer.length-2)*VIEWPORT_H)){ //always keeping at least 1 screen in advance
            this._requestScreenshot(this._screenBuffer.length);
          }

          if(this._scrollHeight > VIEWPORT_H*(this._screenBuffer.length-1)){ //when at the bottom of the page, this stops user from completely drifting away
            this._scrollHeight = heightBackup;
          }

          this._flushBuffer();
          ev.preventDefault();
      });

      canvas.addEventListener('keydown', (ev) => {
        console.log(ev.key);
        if(ev.key.toLocaleLowerCase() === "s"){
          this._actionSender(types.BrowserAction.screenshot, {})
          .catch(console.error);   
        }
      })
    }
  }

  /**
   * Internal method for flushing the current state of the image buffer to the screen. 
   * 
   * Checks whether the images are loaded, uses the current scroll height and optimizes the rendering process.
   */
  private _flushBuffer = () => {
    if(this._canvas.current){
      let ctx = this._canvas.current.getContext('2d');
      
      let firstTileIndex = Math.floor(this._scrollHeight/VIEWPORT_H);
      if(this._screenBuffer.length <= firstTileIndex){ // in case even the first tile is not loaded yet
        return;
      }

      let firstBackground = new Image();
      let secondBackground = new Image();
      
      try{
          firstBackground.src = URL.createObjectURL(this._screenBuffer[firstTileIndex]);
          if(firstTileIndex+1 < this._screenBuffer.length){ // useful at the end of the pages 
            secondBackground.src = URL.createObjectURL(this._screenBuffer[firstTileIndex+1]);
            secondBackground.onload = () => {
              ctx?.clearRect(0,0,VIEWPORT_W || 0, VIEWPORT_H || 0);    
              ctx?.drawImage(firstBackground,0,-(this._scrollHeight%VIEWPORT_H)); //by the time the second screen is loaded, the first should already be loaded (server works sequentially)
              ctx?.drawImage(secondBackground,0,VIEWPORT_H-(this._scrollHeight%VIEWPORT_H));
            }
          }
          else{
            firstBackground.onload = () => {
              ctx?.clearRect(0,0,this._canvas.current?.width || 0, VIEWPORT_H || 0);    
              ctx?.drawImage(firstBackground,0,-(this._scrollHeight%VIEWPORT_H)); 
            }
          }
      }
      catch{};
    }
  }

  render(){
    return <canvas 
    ref={this._canvas}
    tabIndex={1}
    style={{width:100+'%', height: 75+"vh"}}
    width={VIEWPORT_W+"px"}
    height={VIEWPORT_H+"px"}/>
  }
}

interface IRecScreenProps {
  location: any // React Router location
}

interface IRecScreenState {
  loading: boolean,
  ok: boolean,
  RecordingState: types.AppState["RecordingState"],
  TabState: types.AppState["TabState"]
}

/**
 * Top-level React Component encompassing all the other components at the Recording Screen.
 */
class RecordingScreen extends Component<IRecScreenProps, IRecScreenState> {
  /**
   * React Router location (used for accessing the query part of the url, hostname etc.)
   */
  location: any;
  /**
   * React ref to the current StreamWindow.
   * 
   * Useful for calling the non-react functions of the current StreamWindow from this component.
  */
  private _canvas : React.RefObject<StreamWindow>;
  /**
   * WebSockets connection for sending the textual commands to the server.
   */
  private _messageChannel : ACKChannel|null = null;
  /**
   * WebSockets connection for image data transfer.
   */
  private _streamChannel : ACKChannel|null = null;
  
  /**
   * Boolean flag for stopping the playback.
   * 
   * If set true, the asynchronous recording playback will stop (and set the flag back to false).
   */
  private _stopSignal : boolean = false;

  /**
   * Resolve function of the _stepper() generated Promise.
   * 
   * Once called, the stepper promise gets resolved and the playback moves one step forward (if running in the step mode, noop otherwise).
   */
  private _step : Function = () => {};

  /**
   * Stores current expected screen tile id.
   * 
   * Set after the "screenshot response" message, the next binary streamChannel message will contain this id's screenshot.
   */
  private currentScreencastRequestIdx: number = 0;

  /**
   * Stores ids of already requested screen tiles. 
   * 
   * Used for optimization (eliminating double requests - quite important when binding the requester on the wheel event, which fires rapidly).
   */
  private requestedScreens : number[] = [];

  constructor(props : IRecScreenProps){  
    super(props);
    this.location = props.location;
    this._canvas = createRef();

    this.state = {
      ok: false,
      loading: true,
      TabState:{
        tabs: [], 
        currentTab: -1
      },
      RecordingState:{
        playback: null,
        isRecording: false,
        playbackError: "",
        currentActionIdx: -1,
        recording: {name: "", actions: []},
      }
    }
  }

  /**
   * Bootstrapping method for starting all the necessary connections and binding the event handlers.
   */
  private _streamSetup = () => {
    const _broadcastMsgHandler = (data : Blob) => {
      let obj = JSON.parse(data as any);
      if("tabs" in obj){
        this.setState({TabState: (obj as types.AppState["TabState"])});
      }
      else if ("token" in obj){
        this._streamChannel?.send({"token": (obj as {token:string}).token});
      }
    }

    const _storeRequestedScreencast = (obj : Blob) => {
      this._canvas.current?.addScreen(this.currentScreencastRequestIdx,obj);
    }
    
    this._streamChannel = new ACKChannel(new WebSocket(`ws://${window.location.hostname}:8081`), _storeRequestedScreencast)
    this._messageChannel = new ACKChannel(new WebSocket(`ws://${window.location.hostname}:8080`),_broadcastMsgHandler);

    this._messageChannel.addEventListener('open', () => {
      this._messageChannel?.send({messageID: null, payload: {type: 'noop', data: {}}}); // Starts/Wakes up the streamed browser (uses no-response .send() instead of .request())
    });

    this._messageChannel.addEventListener('close', () => {
      alert("The connection to the server has been closed. Please, check if the server is running, refresh this page and try again...");
    });
  }

  /**
   * Handles mostly REST API communication (downloading the recording, initializing the state).
   */
  componentDidMount(){
    
    this.setState({loading: true});

    let query = querystring.parse(this.location.search.slice(1));

    getAPI("recording?id="+query.id)
    .then((response) =>
    {
        this.setState(prevState => ({
          loading: false,
          ok: true,
          RecordingState:{
            ...prevState.RecordingState,
            recording: (response.data as any)
          } 
        }));
        console.log(response.data);
    }).catch(err => {
      this.setState({
        loading: false,
        ok: false
      })
    })

    //WebSockets setup (for the interactive fun)
    this._streamSetup();

    console.log(this.state);
  }
 
 /**
 * Helper function for sending the screenshot requests to the server over the corresponding WS channel.
 * Checks whether the requested screenshot has been requested before - in that case, this new request is discarded. Otherwise the request is made and handled further.
 * @param {number} screenNumber - Number of the currently requested screen.
 */
  private _requestScreenshot = (screenNumber: number) : void => {
    if(this.requestedScreens.includes(screenNumber)){
      return;
    }
    this.requestedScreens.push(screenNumber);
    this._streamChannel?.request({screenNumber: screenNumber})
      .then(() => {this.currentScreencastRequestIdx = screenNumber})
      .catch(console.error);
  }

  /**
   * Clears the internal screen buffer and requests first two screens on the page.
   * @returns IIFE-style function to be called when complete rerendering is required.
   */
  private _initRender(){
      return (() => {
      this._canvas.current?.resetView();
      this.requestedScreens = [];
      this._requestScreenshot(0);
      this._requestScreenshot(1);
      });
  }

  /**
   * Helper method to facilitate client->server requests and recording mechanism.
   * 
   * Requests the specified action via the messagingChannel (ACK channel), if the recording session is active, the action gets recorded.
   * @param {types.BrowserAction} actionType - Type (defined in the types.BrowserAction enum) of the requested action.
   * @param {object} data - Object with the action-type-dependent data.
   * @returns Promise gets resolved when the Action is executed (on the server) and the browser view is rerendered. Might throw (reject response) when there is a problem with the action execution.
   */
  private _requestAction = (actionType: types.BrowserAction, data: object) => {
    return this._messageChannel?.request({type: types.BrowserAction[actionType], data: data})
    .then(responseMessage => {
      if(this.state.RecordingState.isRecording){
        this.setState(prevState => (
          {RecordingState: {
            ...prevState.RecordingState,
            recording:
              {
                ...prevState.RecordingState.recording,
                actions: [...prevState.RecordingState.recording.actions, 
                  (responseMessage as any).payload]
              }
            }
          }
        ));
      };
    })
    .then(this._initRender())
    .catch((e) => {
      alert(`Action failed.\n\n` + (e.errorMessage ? `Reason: ${e.errorMessage.split("\n")[0]}` : ""));
      throw(e); // throwing again (just a communication channel, errors should be handled by the requesters!)
    })
    
  }

  /**
   * "Hacky" solution for stopping the playback.
   * @returns The promise gets normaly immediately resolved, when the class member _stopSignal is set, the promise gets rejected (which then disables the playback).
   */
  private _stop = () => {
    return new Promise<void>((res,rej) => {
      if(this._stopSignal) rej({errorMessage:"Execution stopped by user."}); else res();
    });
  }

  /**
   * "Hacky" solution for the playback "Step" functionality.
   * @returns The promise's resolve function is exposed as a private class member _step, pressing the "Next Step button" calls this function, resulting in the Promise getting resolved and the playback resumed.
   */
  private _stepper = () => {
    return new Promise<void>((res) => {
      this._step = res;
    })
  }

  /**
   * Starts the playback session.
   * @param {boolean} step - If true, the playback will wait for the _stepper() promise to resolve with every action (next step button click). 
   * @returns Gets resolved after the recording has ended (rejected if there was an error during the playback).
   */
  private _playRecording = (step : boolean = false) : Promise<void> => {
    this.setState(prevState => (
      {
        RecordingState:{
          ...prevState.RecordingState,
          isRecording: false,
          playback: step ? "step" : "cont"
        }
      }
    ));
    if(this.state.RecordingState.recording.actions){ //!== []
      /* Sends all actions to server, waits for ACK (promise resolve) after every sent action. */
      return [{idx: -1, type: 'reset',data: {}},
        ...this.state.RecordingState.recording.actions.map((x, idx) => ({idx: idx, type: (x.type), data: x.data}))
      ].reduce((p : Promise<any>, action) => {
          return p.then(() => {
            this.setState(prevState => (
              {
                RecordingState: {
                ...prevState.RecordingState,
                playbackError: "",
                currentActionIdx: action.idx
              }}
            ),this._initRender());
            return Promise.all([
              this._messageChannel?.request(action), 
              this.state.RecordingState.playback === "step" ? this._stepper() : Promise.resolve(), 
              this._stop()
            ]);
          }).catch((e) => {
            console.error(`Action no. ${action.idx} failed :(`);
            this._stopSignal = false;
            this.setState(prevState => (
              {
                RecordingState: {
                ...prevState.RecordingState,
                playback: null,
                playbackError: e.errorMessage,
              }}
            ));
            console.log(e);
            console.log(this.state);
            return Promise.reject(e);
          });
        }, Promise.resolve())
        .then(() =>
          this.setState(prevState => (
            {
              RecordingState: {
              ...prevState.RecordingState,
              playback: null,
              currentActionIdx: -1 // removes highlight after playback
            }}), this._initRender()) 
        );
    };
    return Promise.resolve();
  }

  /**
   * Prompts the user for the text to paste to the website, then requests an insertText action.
   */
  private _insertText = () => {
    let text = prompt("Enter text to paste to the website:");
    if(text !== null && text !== ""){
      this._requestAction(types.BrowserAction.insertText, {text: text});
    }
  }

  /**
   * "Router" method (used mainly as a callback in child components) for the playback/recording control.
   * @param {string} action - Type of the requested action (play|record|step|stop).
   */
  private _recordingControl = (action : string) => {
    switch (action) {
      case 'play':
          if(window.confirm("Starting the playback closes all open tabs. Do you want to proceed?")){
            this._playRecording().catch(() => {});
          }
        break;
      case 'record':
          if(!this.state.RecordingState.isRecording){
            if(!window.confirm("Starting the recording session closes all open tabs. Do you want to proceed?")){
              break;
            }
            if(!this.state.RecordingState.recording){ //recording === []
              this._messageChannel?.send({type: 'reset', data: {}}); 
            }
          }
          else{
            postAPI("updateRecording",this.state.RecordingState.recording).catch(console.log);
          }

          (!this.state.RecordingState.isRecording ? this._playRecording() : Promise.resolve()).then( () =>
          this.setState(prevState => (
            {
              RecordingState: {
              ...prevState.RecordingState,
              isRecording: !prevState.RecordingState.isRecording
            }}))
          ).catch(() => {}); //if playback fails, recording does not start.
          break;
      case 'step':
        if(this.state.RecordingState.playback === "step"){
          this._step();
        }
        else{
          this._playRecording(true).catch(()=>{});
        }
        
        break;
      case 'stop':
        this._stopSignal = true;
        this._step(); // to resolve the pending "Step" promise, which would block the termination of the playback otherwise.
        this.setState((prevState) => ({RecordingState:{...prevState.RecordingState, playbackError: "", currentActionIdx: -1}}));
        break;
      default:
        throw new Error(`Unrecognized action ${action}!`);
    }
  }

  /**
   * Container object with recording modifier functions (used to pass the modifiers to the child components while still storing the state at the top level)
   * 
   * As of now, this object contains "deleteBlock", "updateBlock", "rearrangeBlocks" and "pushCustomBlock".
   */
  private _recordingModifier : types.RecordingModifier = {
    this: this,
    deleteBlock: function (idx: number){
        this.this.setState((prevState : types.AppState) => (
          {...prevState,
            RecordingState: {
              ...prevState.RecordingState,
              recording: { ...prevState.RecordingState.recording,
                actions: prevState.RecordingState.recording.actions.filter((_,i) => i !== idx)
              }
            }
          }
        ),() => {
          postAPI("updateRecording",this.this.state.RecordingState.recording).catch(console.log);
        })
    },
    updateBlock: function (idx: number, action: types.Action){
      console.log(this.this.state.RecordingState.recording.actions[idx]);
      console.log(action);
      let updatedActions = [...this.this.state.RecordingState.recording.actions];
      updatedActions[idx] = action;
      this.this.setState((prevState: types.AppState) => (
        {...prevState,
          RecordingState: {
            ...prevState.RecordingState,
            recording: { ...prevState.RecordingState.recording,
              actions: updatedActions
            }
          }
        }
        ),() => {
          postAPI("updateRecording",this.this.state.RecordingState.recording).catch(console.log);
        })
    },
    rearrangeBlocks: function (oldidx: number, newidx: number) {
      if(oldidx === newidx){
        return;
      }
      
      let actions = [...this.this.state.RecordingState.recording.actions];
      let action = actions[oldidx];
      actions.splice(oldidx,1);
      actions.splice(newidx,0,action);

      this.this.setState((prevState: types.AppState) => (
        {...prevState,
          RecordingState: {
            ...prevState.RecordingState,
            recording: { ...prevState.RecordingState.recording,
              actions: actions
            }
          }
        }
      ),() => {
        postAPI("updateRecording",this.this.state.RecordingState.recording).catch(console.log);
      })
    },
    pushCustomBlock: function (){
      this.this.setState((prevState: types.AppState) => (
        {...prevState,
          RecordingState: {
            ...prevState.RecordingState,
            recording: { 
              ...prevState.RecordingState.recording,
              actions: [
                ...prevState.RecordingState.recording.actions,
                  {
                   type: "codeblock",
                   data:{"code":"//Include your implementation here..."}
                  }
              ]
            }
          }
        }
      ),() => {
        postAPI("updateRecording",this.this.state.RecordingState.recording).catch(console.log);
      })
    }
  };

  render(){
    return (
      this.state.loading ? <p>Loading...</p> : (
        !this.state.ok ? <p>this recording is broken. <a href="../">Go back...</a></p> :
        <div className="App">
        <Container fluid>
          <Row style={{height:10+'vh', lineHeight: 10+'vh'}}>
            <Col md={2}>
              <p id="goBack" style={{fontSize: 120+"%"}}><a href="../">&lt; {this.state.RecordingState.recording.name}</a></p>
            </Col>
          </Row>
          <Row style={{height:90+'vh'}}>
              <>
              <Col xs={3}>
                <SideBar recordingState={this.state.RecordingState} control={this._recordingControl} recordingModifier={this._recordingModifier}/>
              </Col>
              <Col xs={9}>
                <Container fluid>
                <ToolBar tabState={this.state.TabState} navigationCallback={this._requestAction} />
                <a href="#" onClick={this._insertText}>Insert Text</a>
                <Row>
                  <StreamWindow ref={this._canvas} actionSender={this._requestAction} screenRequester={this._requestScreenshot}/>
                </Row>
                </Container>
              </Col>
              </>
          </Row>
        </Container>
        </div>
      )
  );
  }
}

export {RecordingScreen};
