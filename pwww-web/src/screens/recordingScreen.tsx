import ToolBar from '../components/toolbar';
import SideBar from '../components/side_bar';

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

import querystring from 'querystring';
import {Component} from 'react';
import ACKChannel from '../ACKChannel';

import * as types from 'pwww-shared/types';

import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface IBrowserProps {
  recording: types.APIResponse<{
    name: string, 
    recording: types.RecordedAction[]
  }>
}

class BrowserUI extends Component<IBrowserProps,types.BrowserState>{
  private _canvas : StreamWindow|null = null;
  private _messageChannel : ACKChannel|null = null;
  private _streamChannel : WebSocket|null = null;
  
  constructor(props : IBrowserProps){
    super(props);
  
    this.state = {
      tabState: {currentTab: -1, tabs:[]},
      
      isRecording: false,
      currentActionIdx: -1,
      recording: props.recording.data.recording
    };
  }

  private _broadcastMsgHandler = (obj : object) => {
    if("tabs" in obj){
      this.setState({tabState: (obj as types.BrowserState["tabState"])});
    }
  }

  componentDidMount(){
    this._messageChannel = new ACKChannel(new WebSocket('ws://localhost:8080'),this._broadcastMsgHandler);
    this._streamChannel = new WebSocket('ws://localhost:8081');

    this._messageChannel.addEventListener('open', () => {
      this._messageChannel?.send({type: 'noop', data: {}}); // Starts/Wakes up the streamed browser
      this._canvas = new StreamWindow(this.requestAction);
    });

    this._streamChannel.addEventListener('message', event => {
      this._canvas?.drawToCanvas(event.data);
    })

    this._messageChannel.addEventListener('close', () => {
      alert("The connection to the server has been closed. Please, check if the server is running, refresh this page and try again...");
    });
  }

  requestAction = (actionType: types.BrowserAction, data: object) => {
    this._messageChannel?.request({type: types.BrowserAction[actionType], data: data})
    .then(newAction => {
      if(this.state.isRecording){
        this.setState(prevState => ({recording: [...prevState.recording, (newAction as {currentAction: types.RecordedAction}).currentAction]}));
      }
    });
  }

  playRecording = () : Promise<void> => {
    if(this.state.recording){ //!== []
      /* Sends all actions to server, waits for ACK after every sent action. */
      return [{idx: -1, type: 'reset',data: {}},
        ...this.state.recording.map((x, idx) => ({idx: idx, type: (x.what.type), data: x.what.data}))
      ].reduce((p : Promise<any>, action) => {
          return p.then(() => {
            this.setState({currentActionIdx: action.idx});
            return this._messageChannel?.request(action);
          });
        }, Promise.resolve())
        .then(() =>
          this.setState({currentActionIdx: -1}) // removes highlight after playback
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
            this.setState({isRecording: false});
            this.playRecording();
          }
        break;
      case 'record':
          if(!this.state.isRecording){
            if(!window.confirm("Starting the recording session closes all open tabs. Do you want to proceed?")){
              break;
            }

            if(!this.state.recording){
              this._messageChannel?.send({type: 'reset', data: {}}); 
            }
          }

          (!this.state.isRecording ? this.playRecording() : Promise.resolve()).then( () =>
            this.setState(prevState => ({isRecording: !prevState.isRecording}))
          );
          break;
      default:
        break;
    }
  }

  render(){
    return(
      <>
      <Col xs={3}>
        <SideBar state={this.state} control={this.recordingControl}/>
      </Col>
      <Col xs={9}>
        <Container fluid>
        <ToolBar tabState={this.state.tabState} navigationCallback={this.requestAction} />
        <a href="#" onClick={this.insertText}>Insert Text</a>
        <Row>
          <canvas 
          id="videostream"
          tabIndex={1}
          style={{width:100+'%', height: 75+"vh"}}
          width={1280+"px"}
          height={720+"px"}/>
        </Row>
        </Container>
      </Col>
      </>
    );
  }
} 

class StreamWindow {
  private _canvas : HTMLCanvasElement;

  constructor(actionSender : (actionType: types.BrowserAction, data: object) => void){
    this._canvas = document.getElementById("videostream") as HTMLCanvasElement;

    this._canvas.addEventListener('click', (ev) => {
      let canvasPos = this._canvas.getBoundingClientRect();
      let click = {
        x: (1280/canvasPos.width)*(ev.clientX - canvasPos.left), 
        y: (720/canvasPos.height)*(ev.clientY - canvasPos.top)
      };
      actionSender(types.BrowserAction.click, click);
    });
  }

  drawToCanvas = (image: Blob) => {
    let ctx = this._canvas.getContext('2d');
    let background = new Image();
    background.src = URL.createObjectURL(image);

    background.onload = function(){
      if(ctx !== null){
        ctx.drawImage(background,0,0);   
      }
    }
  }
}

interface IRecScreenProps {
  location: any
}

interface IRecScreenState {
  props: IRecScreenProps,
  loading: boolean,
  recording: {ok: boolean, data: {name: string, recording:object[]}} | null
}

class RecordingScreen extends Component<IRecScreenProps, IRecScreenState> {
  constructor(props : IRecScreenProps){
    super(props);
    this.state = {
      props: props,
      loading: true,
      recording: {
        ok: false,
        data: {
          name: "",
          recording: []
        }
      }
    }
  }

  componentDidMount(){
    this.setState({loading: true});

    let query = querystring.parse(this.state.props.location.search.slice(1));

    fetch("http://localhost:8000/api/recording?id="+query.id).then(x => x.json())
    .then((response) =>
    {
        this.setState({
          loading: false,
          recording: response
        });
    })
  }

  render(){
    return (
      this.state.loading ? <p>loading...</p> : (
        !this.state.recording?.ok ? <p>this recording is broken. <a href="../">Go back...</a></p> :
        <div className="App">
        <Container fluid>
          <Row style={{height:10+'vh', lineHeight: 10+'vh'}}>
            <Col md={2}>
              <p id="goBack" style={{fontSize: 120+"%"}}><a href="../">&lt; {this.state.recording.data.name}</a></p>
            </Col>
          </Row>
          <Row style={{height:90+'vh'}}>
              <BrowserUI recording={this.state.recording as IBrowserProps['recording']}/>
          </Row>
        </Container>
        </div>
      )
  );
  }
}

export default RecordingScreen;
