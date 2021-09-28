/* eslint-disable */
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';

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

import { ApifyTranspiler, Transpiler } from 'pwww-shared/JSTranspiler';
import { saveAs } from 'file-saver';

import * as types from 'pwww-shared/Types';
import React, {
  useRef, useEffect, useState, DragEvent, DragEventHandler, MouseEventHandler,
} from 'react';
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
  recordingState: types.AppState['RecordingState']
}

/**
 * Recording Export/Download modal as a functional React component.
 * @param {object} props - Download modal props (mostly boolean show/hide and some necessary callbacks).
 * @returns The rendered download modal.
 */
function DownloadModal(props : IDownloadModalProps) : JSX.Element {
  const [type, setType] = useState('apify');
  const { closeSelf, show, recordingState } = props;
  return (
    <Modal show={show} onHide={closeSelf}>
      <ModalHeader closeButton>
        <ModalTitle>
          Donwloading script...
        </ModalTitle>
      </ModalHeader>
      <ModalBody>
        <i>Disclaimer: due to the dynamic nature of popup windows, the static transpiling engine does not support tab management. If your recording relies on this functionality, it will most likely break during compiled playback.</i>

        <br />
        <br />
        What enviroment will you be running the script in?
        <hr />
        <Form onSubmit={(ev) => {
          ev.preventDefault();
          let transpiler;
          switch (type) {
            case 'apify':
              transpiler = new ApifyTranspiler();
              break;
            default:
              transpiler = new Transpiler();
              break;
          }
          saveAs(transpiler.translate(recordingState.recording.actions), `${recordingState.recording.name}.js`);
        }}
        >
          <FormGroup>
            <FormControl
              as="select"
              onChange={(ev) => { setType(ev.target.value); }}
              defaultValue={type}
            >
              <option value="apify">Apify</option>
              <option value="node">Local Node.js installation</option>
            </FormControl>
            <hr />
            <div className="d-grid gap-2">
              <Button size="lg" type="submit">Download!</Button>
            </div>
          </FormGroup>
        </Form>
      </ModalBody>
    </Modal>
  );
}

const showAttrs = ['selector', 'url', 'currentTab', 'closing', 'text', 'back', 'code'];
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
  scrollRef: React.MutableRefObject<null> | null
}) {
  const renderInfo = (pps : any) => (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Tooltip {...pps}>
      {props.error.split('\n')[0]}
    </Tooltip>
  );

  const {
    active, action, error, idx, dragStart, dragDrop, dragOver, editBlock, deleteBlock, scrollRef,
  } = props;

  return (
    <Alert
      draggable
      id={idx.toString()}
      className="codeBlock truncate"
      ref={scrollRef}
      onDragStart={dragStart}
      onDragOver={dragOver}
      onDrop={dragDrop}
      // eslint-disable-next-line no-nested-ternary
      variant={active ? (error ? 'danger' : 'primary') : 'secondary'}
    >
      <div className="d-flex justify-content-between">
        <Alert.Heading>
          {action.type}
          {' '}
          {/* eslint-disable no-nested-ternary */}
          {active ? !error
            ? <Spinner as="span" size="sm" animation="border" />
            : (
              <OverlayTrigger
                placement="right"
                overlay={renderInfo}
              >
                <Button variant="outline-secondary">Why?</Button>
              </OverlayTrigger>
            ) : null}
          {/* eslint-enable no-nested-ternary */}
        </Alert.Heading>
        <ButtonToolbar>
          {
            action.data.selector
              ? <Button onClick={() => {(window as any).Browser.highlight(action.data.selector)}} variant="outline-primary">🔮</Button>
              : null
          }
          <Button onClick={editBlock} variant="outline-primary">✏</Button>
          <Button onClick={deleteBlock} variant="outline-danger">❌</Button>
        </ButtonToolbar>
      </div>
      <hr />
      {
        showAttrs.filter((x) => action.data[x]).map((attr) => `${action.data[attr]}`)
      }
    </Alert>
  );
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
  editAction: (action : types.Action) => void,
  /**
     * Current action being edited.
     */
  action: types.Action
}) {
  const {
    action, showModal, closeSelf, editAction,
  } = props;
  return (
    (action ? (
      <Modal show={showModal} onHide={closeSelf}>
        <ModalHeader closeButton>
          <ModalTitle>
            {action.type}
          </ModalTitle>
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={(ev) => {
            ev.preventDefault();
            editAction(action);
            closeSelf();
          }}
          >
            <FormGroup>
              {showAttrs.filter((x) => action.data[x]).map(
                (attr) => (
                  <FormGroup controlId={attr}>
                    <FormLabel>
                      {attr}
                    </FormLabel>
                    <FormGroup as={Row}>
                      <FormControl
                        as={(action.type as any) === 'codeblock' ? 'textarea' : 'input'}
                        onChange={(ev) => { action.data[attr] = ev.target.value; }}
                        defaultValue={action.data[attr]}
                      />
                    </FormGroup>
                  </FormGroup>
                ),
              )}
              <hr />
              <div className="d-grid gap-2">
                <Button size="lg" type="submit">Edit!</Button>
              </div>
            </FormGroup>
          </Form>
        </ModalBody>
      </Modal>
    ) : <></>)
  );
}

/**
 * Side bar as a functional React component.
 * @param {SideBarProps} props - React props object containing current recording state (which is being stored higher up), recording modifiers and recording control callback.
 * @returns The rendered sidebar.
 */
function CodeList(props : { recordingState: SideBarProps['recordingState'], recordingModifier: SideBarProps['recordingModifier'] }) : JSX.Element {
  const ref = useRef(null);

  const [editedID, setEditedID] = useState(0);
  const [draggedID, setDraggedID] = useState(-1);

  const [showModal, setModalVisible] = useState(false);
  const [showInfo, setInfoVisible] = useState(false);

  useEffect(() => (ref.current as any)?.scrollIntoView());

  const { recordingState, recordingModifier } = props;

  return (
    <>
      <CodeEditModal
        showModal={showModal}
        closeSelf={() => setModalVisible(false)}
        action={recordingState.recording.actions[editedID]}
        editAction={(updatedBlock: types.Action) => recordingModifier.updateBlock(editedID, updatedBlock)}
      />
      {
  [...recordingState.recording.actions.map((action : types.Action, idx: number) => (
    <CodeBlock
      // eslint-disable-next-line react/no-array-index-key
      key={idx}
      idx={idx}
      action={action}
      active={recordingState.currentActionIdx === idx}
      error={recordingState.playbackError}
      dragStart={
        (e : DragEvent<Element>) => {
          setDraggedID(parseInt((e.currentTarget as any).id || 0, 10));
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
      dragDrop={
        (e : DragEvent<Element>) => {
          recordingModifier.rearrangeBlocks(draggedID, parseInt((e.currentTarget as any).id || 0, 10));
        }
      }
      deleteBlock={() => {
        recordingModifier.deleteBlock(idx);
      }}
      scrollRef={recordingState.currentActionIdx === idx ? ref : null} // for auto scrolling
    />
  )),
  recordingState.isRecording
    ? <Spinner id="recordingIndicator" animation="grow" variant="danger" />
    : <Button onClick={() => recordingModifier.pushCustomBlock()}>Custom code block</Button>]
}
    </>
  );
}

type SideBarProps = {
  control : (action: string) => void,
  recordingModifier : types.RecordingModifier,
  recordingState: types.AppState['RecordingState']
};

/**
 * Side bar as a functional React component.
 * @param {SideBarProps} props - React props object containing current recording state (which is being stored higher up), recording modifiers and recording control callback.
 * @returns The rendered sidebar.
 */
export default function SideBar(props : SideBarProps) : JSX.Element {
  const [downloadModal, setDownloadModal] = useState(false);
  const { control, recordingState, recordingModifier } = props;

  const isPlaybackRunning = !!recordingState.playback;

  return (
    <Container style={{ height: `${90}vh` }}>
      <DownloadModal show={downloadModal} closeSelf={() => setDownloadModal(false)} recordingState={recordingState} />
      <Row style={{ marginBottom: `${10}px` }}>
        <Col>
          <Button
            key={0}
            onClick={() => {
              if (!isPlaybackRunning) control('play'); else control('stop');
            }}
            variant={isPlaybackRunning ? 'dark' : 'light'}
          >
            {(!isPlaybackRunning) ? '▶️' : '🛑'}
          </Button>
          <Button key={3} onClick={() => control('step')} variant={isPlaybackRunning ? 'dark' : 'light'} disabled={recordingState.playback === 'cont'}>{isPlaybackRunning ? '➡️' : '🦶' }</Button>
          <Button key={1} onClick={() => control('record')} variant={recordingState.isRecording ? 'dark' : 'light'}>
            {!recordingState.isRecording ? '🎦' : '⏹️'}
          </Button>
          <Button key={2} onClick={() => setDownloadModal(true)} variant="light">📥</Button>
        </Col>
      </Row>
      <Row>
        <Col id="codeScroll" style={{ height: `${75}vh`, overflowY: 'scroll' }}>
          <CodeList recordingState={recordingState} recordingModifier={recordingModifier} />
        </Col>
      </Row>
    </Container>
  );
}
