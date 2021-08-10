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

class StreamWindow extends Component<any, any> {
  private _canvas : React.RefObject<HTMLCanvasElement>;
  private actionSender : Function;
  
  constructor(props: {actionSender : (actionType: types.BrowserAction, data: object) => void}){
    super(props);

    this._canvas = createRef();
    this.actionSender = props.actionSender;
  }

  componentDidMount = () => {

    if(this._canvas.current){
      this._canvas.current.addEventListener('click', (ev) => {
        if(this._canvas.current){
          let canvasPos = this._canvas.current.getBoundingClientRect();
          let click = {
            x: (1280/canvasPos.width)*(ev.clientX - canvasPos.left), 
            y: (720/canvasPos.height)*(ev.clientY - canvasPos.top)
          };
          this.actionSender(types.BrowserAction.click, click);
        }
      });
    }
  }
  drawToCanvas = (image: Blob) => {
    if(this._canvas.current){
      let ctx = this._canvas.current.getContext('2d');
      let background = new Image();
      background.src = URL.createObjectURL(image);
  
      background.onload = function(){
        if(ctx !== null){
          ctx.drawImage(background,0,0);   
        }
      }
    }
  }

  render(){
    return <canvas 
    ref={this._canvas}
    tabIndex={1}
    style={{width:100+'%', height: 75+"vh"}}
    width={1280+"px"}
    height={720+"px"}/>
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
  private _streamChannel : WebSocket|null = null;

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
        isRecording: false,
        playbackError: false,
        currentActionIdx: -1,
        recording: {name: "", actions: []},
      }
    }
  }

  private _streamSetup = () => {
    const _broadcastMsgHandler = (obj : object) => {
      if("tabs" in obj){
        this.setState({TabState: (obj as types.AppState["TabState"])});
      }
    }

    this._messageChannel = new ACKChannel(new WebSocket('ws://localhost:8080'),_broadcastMsgHandler);
    this._streamChannel = new WebSocket('ws://localhost:8081');

    this._messageChannel.addEventListener('open', () => {
      this._messageChannel?.send({type: 'noop', data: {}}); // Starts/Wakes up the streamed browser
    });

    this._streamChannel.addEventListener('message', event => {
      if(this._canvas.current){
        this._canvas.current.drawToCanvas(event.data);
      }
    })

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

  requestAction = (actionType: types.BrowserAction, data: object) => {
    this._messageChannel?.request({type: types.BrowserAction[actionType], data: data})
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
    // does not catch just yet ;
  }

  playRecording = () : Promise<void> => {
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
                playbackError: false,
                currentActionIdx: action.idx
              }}
            ));
            return this._messageChannel?.request(action);
          }).catch(() => {
            console.error(`Action no. ${action.idx} failed :(`);
            this.setState(prevState => (
              {
                RecordingState: {
                ...prevState.RecordingState,
                playbackError: true,
              }}
            ));
            return Promise.reject();
          });
        }, Promise.resolve())
        .then(() =>
          this.setState(prevState => (
            {
              RecordingState: {
              ...prevState.RecordingState,
              currentActionIdx: -1
            }})) // removes highlight after playback
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
      default:
        break;
    }
  }

  recordingModifier = {
    this: this,
    deleteBlock: function (idx: number){
        this.this.setState((prevState) => (
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
    rearrangeBlocks: function (oldidx: number, newidx: number) {
      if(oldidx === newidx){
        return;
      }
      
      let actions = [...this.this.state.RecordingState.recording.actions];
      let action = actions[oldidx];
      actions.splice(oldidx,1);
      actions.splice(newidx,0,action);

      this.this.setState((prevState) => (
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
                  <StreamWindow ref={this._canvas} actionSender={this.requestAction}/>
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
