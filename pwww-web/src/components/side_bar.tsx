import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button'

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';

import {useRef} from 'react';
import {Transpiler} from 'pwww-shared/jsTranspiler';
import {saveAs} from 'file-saver'

import * as types from 'pwww-shared/types';
import { useEffect } from 'react';

type SideBarProps = {
  control : (action: string) => void,
  recordingState: types.AppState["RecordingState"]
}

function SideBar(props : SideBarProps) : JSX.Element {
    const downloadRecording = () => {
      let transp = new Transpiler();
      saveAs(transp.translate(props.recordingState.recording.actions), `${props.recordingState.recording.name}.js`);
    }

    return (
      <Container style={{height: 90+'vh'}}>
        <Row style={{marginBottom: 10+"px"}}>
          <Col>
            <Button key={0} onClick={() => props.control('play')} variant="light">Play</Button>
            <Button key={1} onClick={() => props.control('record')} variant={props.recordingState.isRecording ? "dark" : "light"}>
              {!props.recordingState.isRecording ? "Start recording" : "Stop recording"}
            </Button>
            <Button key={2} variant="light">Settings</Button> 
            <Button key={3} onClick={downloadRecording} variant="light">Download</Button>
          </Col>
        </Row>
        <Row>
          <Col id={"codeScroll"} style={{height: 75+"vh", overflowY:'scroll'}}>
            <CodeList recordingState={props.recordingState} deleteBlock={props.control}/>
          </Col>
        </Row>
      </Container>
    );
}

function CodeList(props : { recordingState: SideBarProps['recordingState'], deleteBlock: Function }) : JSX.Element {
  const showAttrs = ["selector", "url", "currentTab", "closing", "text"];
  const ref = useRef(null);

  useEffect(()=>(ref.current as any)?.scrollIntoView());

  return (
  <>{
  [...props.recordingState.recording.actions.map((action : types.RecordedAction, idx: number ) => (
    <Alert 
      key={idx} 
      ref={props.recordingState.currentActionIdx === idx ? ref : null} //for scrolling
      variant= {props.recordingState.currentActionIdx === idx ? "primary" : "secondary"} //for color
    >
      <div className="d-flex justify-content-between">
      <Alert.Heading>{action.what.type}</Alert.Heading>
        <Button onClick={() => {
          window.confirm("Removing an action can lead to inconsistent recording. Do you want to proceed?");
          props.deleteBlock(idx);
        }} variant="outline-danger">❌</Button>
      </div>
      <hr></hr>
      {
        showAttrs.filter((x) => action.what.data[x]).map(attr => `${action.what.data[attr]}`)
      }
    </Alert>
  )),
  props.recordingState.isRecording ? <Spinner id={"recordingIndicator"} animation="grow" variant="danger" /> : null]}
  </>);
  }

  export default SideBar;