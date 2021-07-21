import ToolBar from './components/toolbar';
import SideBar from './components/side_bar';

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

import {Component} from 'react';


import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

class BrowserUI extends Component{
  canvas = null;
  
  constructor(props){
    super(props);

    this.state = {
      tabState: {currentTab: -1, tabs:[]},
      
      isRecording: false,
      recording: [],
    };
  }

  componentDidMount(){
    this.messageChannel = new WebSocket('ws://localhost:8080');
    this.streamChannel = new WebSocket('ws://localhost:8081');

    this.messageChannel.addEventListener('open', () => {
      this.canvas = new StreamWindow(this.sendAction);
    });

    this.streamChannel.addEventListener('message', event => {
      this.canvas.drawToCanvas(event.data);
    })

    this.messageChannel.addEventListener('message', event => {
      try{
        let obj = JSON.parse(event.data);
        
        if("tabs" in obj){
          this.setState({tabState: obj});
        }
        else if("recording" in obj){
          this.setState({recording: obj.recording},() => {
            let scroll = document.getElementById("recordingIndicator");
            if(scroll){
              scroll.scrollIntoView();
            }}
          );
        }
      }
      catch{}
    });

    this.messageChannel.addEventListener('close', () => {
      alert("The connection to the server has been closed. Please, check if the server is running, refresh this page and try again...");
    });

  }

  recordingControl = (action) => {
    switch (action) {
      case 'play':
          if(window.confirm("Starting the playback closes all open tabs. Do you want to proceed?")){
            this.setState(prevState => ({isRecording: false}));
            this.sendAction('playRecording',{delay: 1000});
          }
        break;
      case 'record':
          if(!this.state.isRecording){
            if(!window.confirm("Starting the recording session closes all open tabs. Do you want to proceed?")){
              break;
            }
          }
          this.setState(prevState => ({isRecording: !prevState.isRecording}),
            ()=>{ this.sendAction('recording',{ on: this.state.isRecording }) });
          break;
      default:
        break;
    }
  }

  sendAction = (actionType, data) => {
    let action = {type: actionType, data: data};
    this.messageChannel.send(JSON.stringify(action));
  }

  render(){
    return(
      <>
      <Col>
        <SideBar state={this.state} control={this.recordingControl}/>
      </Col>
      <Col md={9}>
        <Container fluid>
        <ToolBar tabState={this.state.tabState} navigationCallback={this.sendAction} />
        <Row>
          <canvas 
          id="videostream"
          tabIndex="1"
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

// Not a React Component, regular JS class
class StreamWindow {

  constructor(actionSender){
    this.canvas = document.getElementById("videostream");

    this.canvas.addEventListener('click', (ev) => {
      let canvasPos = ev.currentTarget.getBoundingClientRect();
      let click = {
        x: (1280/canvasPos.width)*(ev.clientX - canvasPos.left), 
        y: (720/canvasPos.height)*(ev.clientY - canvasPos.top)
      };
      actionSender('click',click);
    });

    this.canvas.addEventListener('keydown', (ev) => {
      actionSender('keydown',{key: ev.code});
    });
  }

  drawToCanvas = (image) => {
    let ctx = this.canvas.getContext('2d');
    let background = new Image();
    background.src = URL.createObjectURL(image);

    background.onload = function(){
      ctx.drawImage(background,0,0);   
    }
  }
}

function RecordingScreen() {
  // !! Needs better design (more responsive)!

  return (
    <div className="App">
      <Container fluid>
        <Row style={{height:10+'vh', lineHeight: 10+'vh'}}>
          <Col md={2}>
            <p id="goBack" style={{fontSize: 120+"%"}}>&lt; Recording name</p>
          </Col>
        </Row>
        <Row style={{height:90+'vh'}}>
            <BrowserUI/>
        </Row>
      </Container>
    </div>
  );
}

export default RecordingScreen;
