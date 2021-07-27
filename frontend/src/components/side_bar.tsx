import Alert from 'react-bootstrap/Alert';

import Button from 'react-bootstrap/Button'

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';

function SideBar(props : {control: any, state: {isRecording: boolean, recording: any, currentActionIdx: number}}) : JSX.Element {
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

function CodeList(props : any) : JSX.Element {
  const showAttrs = ["selector", "url"];

  return (
  <>{
  [...props.recording.map((action : any, idx: number ) => (
    <Alert key={idx} variant= {props.currentActionIdx === idx ? "primary" : "secondary"}>
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