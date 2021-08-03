import Alert from 'react-bootstrap/Alert';

import Button from 'react-bootstrap/Button'

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';

import {useRef} from 'react';

import * as types from 'pwww-shared/types';
import { useEffect } from 'react';

type SideBarProps = {
  control : (action: string) => void,
  state: {
    isRecording: boolean, 
    recording: types.BrowserState["recording"],
    currentActionIdx: number
  }
}

function SideBar(props : SideBarProps) : JSX.Element {
    return (
      <Container style={{height: 90+'vh'}}>
        <Row style={{marginBottom: 10+"px"}}>
          <Col>
            <Button key={0} onClick={() => props.control('play')} variant="light">Play</Button>
            <Button key={1} onClick={() => props.control('record')} variant={props.state.isRecording ? "dark" : "light"}>
              {!props.state.isRecording ? "Start recording" : "Stop recording"}
            </Button>
            <Button key={2} variant="light">Settings</Button>
          </Col>
        </Row>
        <Row>
          <Col id={"codeScroll"} style={{height: 75+"vh", overflowY:'scroll'}}>
            <CodeList recording={props.state.recording} currentActionIdx={props.state.currentActionIdx} isRecording={props.state.isRecording}/>
          </Col>
        </Row>
      </Container>
    );
}

function CodeList(props : SideBarProps['state']) : JSX.Element {
  const showAttrs = ["selector", "url", "currentTab", "closing", "text"];
  const ref = useRef(null);

  useEffect(()=>(ref.current as any)?.scrollIntoView());

  return (
  <>{
  [...props.recording.recording.map((action : types.RecordedAction, idx: number ) => (
    <Alert key={idx} ref={props.currentActionIdx === idx ? ref : null} variant= {props.currentActionIdx === idx ? "primary" : "secondary"}>
      <Alert.Heading>{action.what.type}</Alert.Heading>
      <hr></hr>
      {
        showAttrs.filter((x) => action.what.data[x]).map(attr => `${action.what.data[attr]}`)
      }
    </Alert>
  )),
  props.isRecording ? <Spinner id={"recordingIndicator"} animation="grow" variant="danger" /> : null]}
  </>);
  }

  export default SideBar;