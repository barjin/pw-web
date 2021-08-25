import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import {Component, createRef} from 'react';

import ToolBar from '../components/toolbar';
import SideBar from '../components/side_bar';

import querystring from 'querystring';

import ACKChannel from '../ACKChannel';
import * as types from 'pwww-shared/types';
import {getAPI, postAPI} from '../restAPI';

import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const VIEWPORT_W = 1280;
const VIEWPORT_H = 720;

class StreamWindow extends Component<any, any> {
  private _canvas : React.RefObject<HTMLCanvasElement>;
  private _actionSender : (...args: any[]) => Promise<void>;
  private _requestScreenshot : (screenNumber: number) => void;
  private _scrollHeight : number = 0;
  private _screenBuffer : Blob[] = [new Blob([])];
  
  constructor(props: {actionSender : (actionType: types.BrowserAction, data: object) => Promise<void>, screenRequester: (screenNumber: number) => void}){
    super(props);

    this._canvas = createRef();
    this._actionSender = props.actionSender;
    this._requestScreenshot = props.screenRequester;
  }

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

  addScreen(idx: number, data: Blob) : void{
    this._screenBuffer[idx] = data;
    this._flushBuffer();
  }

  resetView(): void {
    // setter for external buffer access. resets the viewport (in most cases mimics the default browser behaviour e.g after browsing... perhaps would use some more finesse)
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

class RecordingScreen extends Component<IRecScreenProps, IRecScreenState> {
  location: any;
  private _canvas : React.RefObject<StreamWindow>;
  private _messageChannel : ACKChannel|null = null;
  private _streamChannel : ACKChannel|null = null;
  
  private _stopSignal : boolean = false;
  private _step : Function = () => {};

  private currentScreencastRequestIdx: number = 0;
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

  componentDidMount(){
    // REST API communication (downloading the recording, initializing the state)
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

  requestScreenshot = (screenNumber: number) : void => {
    if(this.requestedScreens.includes(screenNumber)){
      return;
    }
    this.requestedScreens.push(screenNumber);
    this._streamChannel?.request({screenNumber: screenNumber})
      .then(() => {this.currentScreencastRequestIdx = screenNumber})
      .catch(console.error);
  }

  private _initRender(){
      return (() => {
      this._canvas.current?.resetView();
      this.requestedScreens = [];
      this.requestScreenshot(0);
      this.requestScreenshot(1);
      });
  }

  requestAction = (actionType: types.BrowserAction, data: object) => {
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
    .then(this._initRender());
    // does not catch just yet (just a communication channel, errors should be handled by the requesters!)
  }

  private _stop = () => {
    return new Promise<void>((res,rej) => {
      if(this._stopSignal) rej({errorMessage:"Execution stopped by user."}); else res();
    });
  }

  private _stepper = () => {
    return new Promise<void>((res) => {
      this._step = res;
    })
  }

  playRecording = (step : boolean = false) : Promise<void> => {
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

  insertText = () => {
    let text = prompt("Enter text to paste to the website:");
    if(text !== null && text !== ""){
      this.requestAction(types.BrowserAction.insertText, {text: text});
    }
  }

  recordingControl = (action : string) => {
    switch (action) {
      case 'play':
          if(window.confirm("Starting the playback closes all open tabs. Do you want to proceed?")){
            this.playRecording().catch(() => {});
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

          (!this.state.RecordingState.isRecording ? this.playRecording() : Promise.resolve()).then( () =>
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
          this.playRecording(true).catch(()=>{});
        }
        
        break;
      case 'stop':
        this._stopSignal = true;
        this._step(); // to resolve the pending "Step" promise, which would block the termination of the playback otherwise.
        this.setState((prevState) => ({RecordingState:{...prevState.RecordingState, playbackError: "", currentActionIdx: -1}}));
        break;
      default:
        break;
    }
  }

  recordingModifier : types.RecordingModifier = {
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
                <SideBar recordingState={this.state.RecordingState} control={this.recordingControl} recordingModifier={this.recordingModifier}/>
              </Col>
              <Col xs={9}>
                <Container fluid>
                <ToolBar tabState={this.state.TabState} navigationCallback={this.requestAction} />
                <a href="#" onClick={this.insertText}>Insert Text</a>
                <Row>
                  <StreamWindow ref={this._canvas} actionSender={this.requestAction} screenRequester={this.requestScreenshot}/>
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

export default RecordingScreen;
