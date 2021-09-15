import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button'

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Spinner from 'react-bootstrap/Spinner';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';

import Modal from 'react-bootstrap/Modal';
import ModalTitle from 'react-bootstrap/ModalTitle';
import ModalBody from 'react-bootstrap/ModalBody';
import ModalHeader from 'react-bootstrap/ModalHeader';

import Form from 'react-bootstrap/Form';
import FormGroup from 'react-bootstrap/FormGroup';
import FormLabel from 'react-bootstrap/FormLabel';
import FormControl from 'react-bootstrap/FormControl';

import {ApifyTranspiler, Transpiler} from 'pwww-shared/JSTranspiler';
import {saveAs} from 'file-saver'

import * as types from 'pwww-shared/Types';
import {useRef, useEffect, useState, DragEvent, DragEventHandler, MouseEventHandler } from 'react';
import ButtonToolbar from 'react-bootstrap/esm/ButtonToolbar';


interface IDownloadModalProps {
  /**
   * Determines whether the download modal is visible.
   */
  show: boolean,
  /**
   * Callback function, sets the modal visibility to `false` higher up.
  */
  closeSelf: () => void,
  /**
   * The current state of the recording (required for the code generation).
   */
  recordingState: types.AppState["RecordingState"]
}

/**
 * Recording Export/Download modal as a functional React component. 
 * @param {object} props - Download modal props (mostly boolean show/hide and some necessary callbacks).
 * @returns The rendered download modal.
 */
function DownloadModal(props : IDownloadModalProps) : JSX.Element{
  const [type, setType] = useState("apify");
  return(
    <Modal show={props.show} onHide={props.closeSelf}>
    <ModalHeader closeButton>
      <ModalTitle>
        Donwloading script...
      </ModalTitle>
    </ModalHeader>
    <ModalBody>
    <i>Disclaimer: due to the dynamic nature of popup windows, the static transpiling engine does not support tab management. If your recording relies on this functionality, it will most likely break during compiled playback.</i>
      
      <br></br><br></br>
      What enviroment will you be running the script in?
      <hr></hr>
      <Form onSubmit={(ev) => {
        ev.preventDefault();
        var transpiler;
        switch(type){
          case 'apify':
            transpiler = new ApifyTranspiler();
            break;
          default:
            transpiler = new Transpiler();
            break;
        }
        saveAs(transpiler.translate(props.recordingState.recording.actions), `${props.recordingState.recording.name}.js`);
      }}>
        <FormGroup>
          <FormControl
            as="select"
            onChange={(ev) => {setType(ev.target.value)}}
            defaultValue={type}
          >
            <option value="apify">Apify</option>
            <option value="node">Local Node.js installation</option>
          </FormControl>
          <hr></hr>
              <div className="d-grid gap-2">
              <Button size="lg" type="submit">Download!</Button>
              </div>
        </FormGroup> 
      </Form>
    </ModalBody>
  </Modal>
  )
}

type SideBarProps = {
  control : (action: string) => void,
  recordingModifier : types.RecordingModifier,
  recordingState: types.AppState["RecordingState"]
}

/**
 * Side bar as a functional React component. 
 * @param {SideBarProps} props - React props object containing current recording state (which is being stored higher up), recording modifiers and recording control callback.
 * @returns The rendered sidebar.
 */
export default function SideBar(props : SideBarProps) : JSX.Element {
    const [downloadModal,setDownloadModal] = useState(false);

    const isPlaybackRunning : boolean = props.recordingState.playback ? true : false;

    return (
      <Container style={{height: 90+'vh'}}>
        <DownloadModal show={downloadModal} closeSelf={() => setDownloadModal(false)} recordingState={props.recordingState}/>
        <Row style={{marginBottom: 10+"px"}}>
          <Col>
            <Button 
              key={0} 
              onClick={() => {
                if(!isPlaybackRunning) props.control('play'); else props.control('stop');
              }} variant={isPlaybackRunning ? "dark" : "light"}>
              {(!isPlaybackRunning)? "Play" : "Stop"}
            </Button>
            <Button key={3} onClick={() => props.control('step')} variant={isPlaybackRunning ? "dark" : "light"} disabled={props.recordingState.playback === "cont"} >{isPlaybackRunning ? "Next step" : "Step by Step" }</Button>
            <Button key={1} onClick={() => props.control('record')} variant={props.recordingState.isRecording ? "dark" : "light"}>
              {!props.recordingState.isRecording ? "Start recording" : "Stop recording"}
            </Button>
            <Button key={2} onClick={() => setDownloadModal(true)} variant="light">Download</Button>
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

/**
 * Side bar as a functional React component. 
 * @param {SideBarProps} props - React props object containing current recording state (which is being stored higher up), recording modifiers and recording control callback.
 * @returns The rendered sidebar.
 */
function CodeList(props : { recordingState: SideBarProps['recordingState'], recordingModifier: SideBarProps["recordingModifier"] }) : JSX.Element {
  const ref = useRef(null);

  const [editedID, setEditedID] = useState(0);
  const [draggedID, setDraggedID] = useState(-1);
  
  const [showModal, setModalVisible] = useState(false);
  const [showInfo, setInfoVisible] = useState(false);

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

      toggleInfo={
        () => setInfoVisible(!showInfo)
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
        props.recordingModifier.deleteBlock(idx);
      }}

      scrollRef={props.recordingState.currentActionIdx === idx ? ref : null} //for auto scrolling
    />
  )),
  props.recordingState.isRecording ? 
    <Spinner id={"recordingIndicator"} animation="grow" variant="danger" /> : 
    <a href="#" onClick={() => props.recordingModifier.pushCustomBlock()}>Custom code block</a>]}
  </>
  )
}

const showAttrs = ["selector", "url", "currentTab", "closing", "text", "back", "code"];

/**
 * Single code block as a functional React component
 * @param {CodeBlockProps} props - React props object contianing event handlers, as well as other code-block related data (action title, active indicator, error message etc.)
 * @returns The rendered code block.
 */
  function CodeBlock(props : {
    /**
     * Index of this block in the whole recording.
     */
    idx: number,
    /**
     * The recorded action represented by this block
     */
    action: types.Action,
    /**
     * During playback, this determines whether this block is being currently run.
     */
    active: boolean,
    /**
     * In case of an error contains string with the error message.
     */
    error: string

    /**
     * Drag start event handler
     */
    dragStart: DragEventHandler,
    /**
     * Drag over event handler
     */
    dragOver: DragEventHandler,
    /**
     * Drag drop event handler
     */
    dragDrop: DragEventHandler,

    /**
     * Hover over the error explain button handler
    */
    toggleInfo: MouseEventHandler<HTMLElement>,
    /**
     * Block editing handler.
     */
    editBlock: MouseEventHandler<HTMLElement>,
    /**
     * Block removal handler.
     */
    deleteBlock: MouseEventHandler<HTMLElement>,

    /**
     * React ref for scrolling the currently active action to view during playback.
     */
    scrollRef: React.MutableRefObject<null>|null
  }){

    const renderInfo = (pps : any) => (
      <Tooltip {...pps}>
        {props.error.split("\n")[0]}
      </Tooltip>
    );
  
    return (
    <Alert 
      draggable
      id={props.idx.toString()}
      className={"codeBlock truncate"}

      ref={props.scrollRef}

      onDragStart={props.dragStart}
      onDragOver={props.dragOver}
      onDrop={props.dragDrop}

      variant= {props.active ? (props.error ? "danger" : "primary") : "secondary"} //for active color
    >
      <div className="d-flex justify-content-between">
      <Alert.Heading>{props.action.type} {props.active ? !props.error ?
        <Spinner as="span" size="sm" animation="border"/> : 
        (
          <OverlayTrigger
            placement="right"
            overlay={renderInfo}
          >
          <Button variant="outline-secondary">Why?</Button>
        </OverlayTrigger>
        ) : null}
      </Alert.Heading>
      <ButtonToolbar>
        <Button onClick={props.editBlock} variant="outline-primary">✏</Button>
        <Button onClick={props.deleteBlock} variant="outline-danger">❌</Button>
        </ButtonToolbar>
      </div>
      <hr></hr>
      {
        showAttrs.filter((x) => props.action.data[x]).map(attr => `${props.action.data[attr]}`)
      }
    </Alert>
    )
  }
/**
 * Modal for code block editing as a functional React component
 * @param props React props object containing currently edited code block details etc.
 * @returns The rendered modal.
 */
  function CodeEditModal(props : {
    /**
     * Boolean value determining the visibility of the modal.
     */
    showModal: boolean,
    /**
     * Callback function to set the modal's visibility to false.
     */
    closeSelf: () => void,
    /**
     * Callback function to edit the action higher up (where the recording is stored).
     */
    editAction: Function,
    /**
     * Current action being edited.
     */
    action: types.Action
  }){

    return(
      (props.action ? (
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
                    as={(props.action.type as any) === "codeblock" ? "textarea" : "input"}
                    onChange = {(ev) => props.action.data[attr] = ev.target.value}
                    defaultValue={props.action.data[attr]}
                  />
                  </FormGroup>
              ))}
              <hr></hr>
              <div className="d-grid gap-2">
              <Button size="lg" type="submit">Edit!</Button>
              </div>
            </FormGroup>
          </Form>
        </ModalBody>
      </Modal>) : <></>)
    )
  }