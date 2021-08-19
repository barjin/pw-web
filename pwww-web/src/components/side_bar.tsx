import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button'

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';

import Modal from 'react-bootstrap/Modal';
import ModalTitle from 'react-bootstrap/ModalTitle';
import ModalBody from 'react-bootstrap/ModalBody';
import ModalHeader from 'react-bootstrap/ModalHeader';

import Form from 'react-bootstrap/Form';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import FormControl from 'react-bootstrap/FormControl';

import {ApifyTranspiler, Transpiler} from 'pwww-shared/jsTranspiler';
import {saveAs} from 'file-saver'

import * as types from 'pwww-shared/types';
import {useRef, useEffect, useState, DragEvent, DragEventHandler, MouseEventHandler } from 'react';

type SideBarProps = {
  control : (action: string) => void,
  recordingModifier : {
    deleteBlock : (idx: number) => void,
    rearrangeBlocks : (oldidx: number, newidx: number) => void,
    updateBlock : (idx: number, action: types.Action) => void,
  },
  recordingState: types.AppState["RecordingState"]
}

function SideBar(props : SideBarProps) : JSX.Element {
    const downloadRecording = () => {
      let transp = new ApifyTranspiler();
      saveAs(transp.translate(props.recordingState.recording.actions), `${props.recordingState.recording.name}.js`);
    }

    return (
      <Container style={{height: 90+'vh'}}>
        <Row style={{marginBottom: 10+"px"}}>
          <Col>
            <Button 
              key={0} 
              onClick={() => {
                if(props.recordingState.currentActionIdx === -1 || props.recordingState.playbackError) props.control('play'); else props.control('stop');
              }} variant="light">
              {(props.recordingState.currentActionIdx === -1 || props.recordingState.playbackError)? "Play" : "Stop"}
            </Button>
            <Button key={1} onClick={() => props.control('record')} variant={props.recordingState.isRecording ? "dark" : "light"}>
              {!props.recordingState.isRecording ? "Start recording" : "Stop recording"}
            </Button>
            <Button key={2} onClick={downloadRecording} variant="light">Download</Button>
          </Col>
        </Row>
        <Row>
          <Col id={"codeScroll"} style={{height: 75+"vh", overflowY:'scroll'}}>
            <CodeList recordingState={props.recordingState} recordingModifier={props.recordingModifier}/>
          </Col>
        </Row>
      </Container>
    );
}

function CodeList(props : { recordingState: SideBarProps['recordingState'], recordingModifier: SideBarProps["recordingModifier"] }) : JSX.Element {
  const ref = useRef(null);

  const [editedID, setEditedID] = useState(0);
  const [draggedID, setDraggedID] = useState(-1);
  
  const [showModal, setModalVisible] = useState(false);

  useEffect(() => (ref.current as any)?.scrollIntoView());

  return (
  <>
  <CodeEditModal 
    showModal={showModal} 
    closeSelf={() => setModalVisible(false)}
    action={props.recordingState.recording.actions[editedID]}
    editAction={(updatedBlock: types.Action) => props.recordingModifier.updateBlock(editedID,updatedBlock)}
    />
  {
  [...props.recordingState.recording.actions.map((action : types.Action, idx: number ) => (
    <CodeBlock
      key={idx}
      idx={idx}

      action={action}
      active={props.recordingState.currentActionIdx === idx}
      error={props.recordingState.playbackError}

      dragStart={
        (e : DragEvent<Element>) => {
          setDraggedID(parseInt((e.currentTarget as any).id || 0));
        }
      }

      editBlock={
        () => {
          setEditedID(idx);
          setModalVisible(true);
        }
      }

      dragOver={
        (e : DragEvent<Element>) => {
          e.preventDefault();
        }
      }

      dragDrop = {
        (e : DragEvent<Element>) => {
          props.recordingModifier.rearrangeBlocks(draggedID, parseInt((e.currentTarget as any).id || 0));
        }
      }

      deleteBlock={() => {
        if(window.confirm("Removing an action can lead to inconsistent recording. Do you want to proceed?")){
          props.recordingModifier.deleteBlock(idx);
        }
      }}

      scrollRef={props.recordingState.currentActionIdx === idx ? ref : null} //for auto scrolling
    />
  )),
  props.recordingState.isRecording ? <Spinner id={"recordingIndicator"} animation="grow" variant="danger" /> : null]}
  </>
  )
}

const showAttrs = ["selector", "url", "currentTab", "closing", "text"];

  function CodeBlock(props : {
    idx: number,
    action: types.Action,
    active: boolean,
    error: boolean

    dragStart: DragEventHandler,
    dragOver: DragEventHandler,
    dragDrop: DragEventHandler,

    editBlock: MouseEventHandler<HTMLElement>,
    deleteBlock: MouseEventHandler<HTMLElement>,

    scrollRef: React.MutableRefObject<null>|null
  }){
  
    return (
    <Alert 
      draggable
      id={props.idx.toString()}
      className={"codeBlock"}

      ref={props.scrollRef}

      onDoubleClick={props.editBlock}
      onDragStart={props.dragStart}
      onDragOver={props.dragOver}
      onDrop={props.dragDrop}

      variant= {props.active ? (props.error ? "danger" : "primary") : "secondary"} //for active color
    >
      <div className="d-flex justify-content-between">
      <Alert.Heading>{props.action.type} {!props.error && props.active ? <Spinner as="span" size="sm" animation="border"/> : null}</Alert.Heading>
        <Button onClick={props.deleteBlock} variant="outline-danger">❌</Button>
      </div>
      <hr></hr>
      {
        showAttrs.filter((x) => props.action.data[x]).map(attr => `${props.action.data[attr]}`)
      }
    </Alert>
    )
  }

  function CodeEditModal(props : {
    showModal: boolean,
    closeSelf: Function,
    editAction: Function,
    action: types.Action
  }){

    return(
      <Modal show={props.showModal} onHide={props.closeSelf}>
        <ModalHeader closeButton>
          <ModalTitle>
            {props.action.type}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={(ev) => {
            ev.preventDefault();
            props.editAction(props.action);
            props.closeSelf();
          }}>
            <FormGroup>
              {showAttrs.filter((x) => props.action.data[x]).map(
                attr => (
                  <FormGroup controlId={attr}>
                  <FormLabel>
                    {attr}
                  </FormLabel>
                  <FormControl 
                    defaultValue={props.action.data[attr]}
                    onChange = {(ev) => props.action.data[attr] = ev.target.value}
                  />
                  </FormGroup>
              ))}
              <FormControl type="submit"></FormControl>
            </FormGroup>
          </Form>
        </ModalBody>
      </Modal>
    )
  }

  export default SideBar;