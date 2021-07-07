import Alert from 'react-bootstrap/Alert';

import Button from 'react-bootstrap/Button'

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import {Component} from 'react';

class SideBar extends Component {
    render(){
      return(
        <Container style={{height: 90+'vh'}}>
          <Row style={{marginBottom: 10+"px"}}>
            <Col>
              <Button key={0} onClick={() => this.props.control('play')} variant="light">Play</Button>
              <Button key={1} onClick={() => this.props.control('record')} variant={this.props.state.isRecording ? "dark" : "light"}>
                {!this.props.state.isRecording ? "Start recording" : "Stop recording"}
              </Button>
              <Button key={2} variant="light">Settings</Button>
            </Col>
          </Row>
          <Row>
            <Col id={"codeScroll"} style={{height: 75+"vh", overflowY:'scroll'}}>
              <CodeList recording={this.props.state.recording} isRecording={this.props.state.isRecording}/>
            </Col>
          </Row>
        </Container>
      );
   }
}

function CodeList(props) {

  
      return (
      [...props.recording.map((action, idx) => (
        <Alert key={idx} variant="primary">
          <Alert.Heading>{action.what.type}</Alert.Heading>
        </Alert>
      )),
      props.isRecording ? <Spinner id={"recordingIndicator"} animation="grow" variant="danger" /> : null]
      );
    }

  export default SideBar;