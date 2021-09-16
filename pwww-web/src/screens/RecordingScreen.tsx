/* eslint-disable max-len */
import {
  Button, Container, Row, Col,
} from 'react-bootstrap';
import React, { Component, createRef } from 'react';

import querystring from 'querystring';
import * as types from 'pwww-shared/Types';
import ToolBar from '../components/ToolBar';
import SideBar from '../components/SideBar';

import ACKChannel from '../ACKChannel';
import { getAPI, postAPI } from '../RestAPI';
import StreamWindow from '../components/StreamWindow';

import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

interface IRecScreenProps {
  location: any // React Router location
}

interface IRecScreenState {
  loading: boolean,
  ok: boolean,
  RecordingState: types.AppState['RecordingState'],
  TabState: types.AppState['TabState']
}

/**
 * Top-level React Component encompassing all the other components at the Recording Screen.
 */
export default class RecordingScreen extends Component<IRecScreenProps, IRecScreenState> {
  /**
   * React Router location (used for accessing the query part of the url, hostname etc.)
   */
  location: any;

  /**
   * React ref to the current StreamWindow.
   *
   * Useful for calling the non-react functions of the current StreamWindow from this component.
  */
  private canvas : React.RefObject<StreamWindow>;

  /**
   * WebSockets connection for sending the textual commands to the server.
   */
  private messageChannel : ACKChannel | null = null;

  /**
   * WebSockets connection for image data transfer.
   */
  private streamChannel : ACKChannel | null = null;

  /**
   * Boolean flag for stopping the playback.
   *
   * If set true, the asynchronous recording playback will stop (and set the flag back to false).
   */
  private stopSignal = false;

  /**
   * Resolve function of the stepper() generated Promise.
   *
   * Once called, the stepper promise gets resolved and the playback moves one step forward (if running in the step mode, noop otherwise).
   */
  private step : () => void;

  /**
   * Stores current expected screen tile id.
   *
   * Set after the "screenshot response" message, the next binary streamChannel message will contain this id's screenshot.
   */
  private currentScreencastRequestIdx = 0;

  /**
   * Stores ids of already requested screen tiles.
   *
   * Used for optimization (eliminating double requests - quite important when binding the requester on the wheel event, which fires rapidly).
   */
  private requestedScreens : number[] = [];

  /**
   * Container object with recording modifier functions (used to pass the modifiers to the child components while still storing the state at the top level)
   *
   * As of now, this object contains "deleteBlock", "updateBlock", "rearrangeBlocks" and "pushCustomBlock".
   */
  private recordingModifier : types.RecordingModifier = {
    this: this,
    deleteBlock(idx: number) {
      this.this.setState((prevState : types.AppState) => (
        {
          ...prevState,
          RecordingState: {
            ...prevState.RecordingState,
            recording: {
              ...prevState.RecordingState.recording,
              actions: prevState.RecordingState.recording.actions.filter((_, i) => i !== idx),
            },
          },
        }
      ), () => {
        postAPI('updateRecording', this.this.state.RecordingState.recording).catch(console.log);
      });
    },
    updateBlock(idx: number, action: types.Action) {
      const updatedActions = [...this.this.state.RecordingState.recording.actions];
      updatedActions[idx] = action;
      this.this.setState((prevState: types.AppState) => (
        {
          ...prevState,
          RecordingState: {
            ...prevState.RecordingState,
            recording: {
              ...prevState.RecordingState.recording,
              actions: updatedActions,
            },
          },
        }
      ), () => {
        postAPI('updateRecording', this.this.state.RecordingState.recording).catch(console.log);
      });
    },
    rearrangeBlocks(oldidx: number, newidx: number) {
      if (oldidx === newidx) {
        return;
      }

      const actions = [...this.this.state.RecordingState.recording.actions];
      const action = actions[oldidx];
      actions.splice(oldidx, 1);
      actions.splice(newidx, 0, action);

      this.this.setState((prevState: types.AppState) => (
        {
          ...prevState,
          RecordingState: {
            ...prevState.RecordingState,
            recording: {
              ...prevState.RecordingState.recording,
              actions,
            },
          },
        }
      ), () => {
        postAPI('updateRecording', this.this.state.RecordingState.recording).catch(console.log);
      });
    },
    pushCustomBlock() {
      this.this.setState((prevState: types.AppState) => (
        {
          ...prevState,
          RecordingState: {
            ...prevState.RecordingState,
            recording: {
              ...prevState.RecordingState.recording,
              actions: [
                ...prevState.RecordingState.recording.actions,
                {
                  type: 'codeblock',
                  data: { code: '//Include your implementation here...' },
                },
              ],
            },
          },
        }
      ), () => {
        postAPI('updateRecording', this.this.state.RecordingState.recording).catch(console.log);
      });
    },
  };

  constructor(props : IRecScreenProps) {
    super(props);
    this.location = props.location;
    this.canvas = createRef();
    this.step = () => {};

    this.state = {
      ok: false,
      loading: true,
      TabState: {
        tabs: [],
        currentTab: -1,
      },
      RecordingState: {
        playback: null,
        isRecording: false,
        playbackError: '',
        currentActionIdx: -1,
        recording: { name: '', actions: [] },
      },
    };
  }

  /**
   * Handles mostly REST API communication (downloading the recording, initializing the state).
   */
  componentDidMount() : void {
    this.setState({ loading: true });

    const query = querystring.parse(this.location.search.slice(1));

    getAPI(`recording?id=${query.id}`)
      .then((response) => {
        this.setState((prevState) => ({
          loading: false,
          ok: true,
          RecordingState: {
            ...prevState.RecordingState,
            recording: (response.data as any),
          },
        }));
      }).catch(() => {
        this.setState({
          loading: false,
          ok: false,
        });
      });

    // WebSockets setup (for the interactive fun)
    this.streamSetup();
  }

  /**
   * Bootstrapping method for starting all the necessary connections and binding the event handlers.
   */
  private streamSetup = () => {
    const broadcastMsgHandler = (data : Blob) => {
      const obj = JSON.parse(data as any);
      if ('tabs' in obj) {
        this.setState({ TabState: (obj as types.AppState['TabState']) });
      } else if ('token' in obj) {
        this.streamChannel?.send({ token: (obj as { token:string }).token });
      }
    };

    const storeRequestedScreencast = (obj : Blob) => {
      this.canvas.current?.addScreen(this.currentScreencastRequestIdx, obj);
    };

    this.streamChannel = new ACKChannel(new WebSocket(`ws://${window.location.hostname}:8081`), storeRequestedScreencast);
    this.messageChannel = new ACKChannel(new WebSocket(`ws://${window.location.hostname}:8080`), broadcastMsgHandler);

    this.messageChannel.addEventListener('open', () => {
      this.messageChannel?.send({ messageID: null, payload: { type: 'noop', data: {} } }); // Starts/Wakes up the streamed browser (uses no-response .send() instead of .request())
    });

    this.messageChannel.addEventListener('close', () => {
      alert('The connection to the server has been closed. Please, check if the server is running, refresh this page and try again...');
    });
  };

  /**
 * Helper function for sending the screenshot requests to the server over the corresponding WS channel.
 * Checks whether the requested screenshot has been requested before - in that case, this new request is discarded. Otherwise the request is made and handled further.
 * @param {number} screenNumber - Number of the currently requested screen.
 */
  private requestScreenshot = (screenNumber: number) : void => {
    if (this.requestedScreens.includes(screenNumber)) {
      return;
    }
    this.requestedScreens.push(screenNumber);
    this.streamChannel?.request({ screenNumber })
      .then(() => { this.currentScreencastRequestIdx = screenNumber; })
      .catch(console.error);
  };

  /**
   * Helper method to facilitate client->server requests and recording mechanism.
   *
   * Requests the specified action via the messagingChannel (ACK channel), if the recording session is active, the action gets recorded.
   * @param {types.BrowserAction} actionType - Type (defined in the types.BrowserAction enum) of the requested action.
   * @param {object} data - Object with the action-type-dependent data.
   * @returns Promise gets resolved when the Action is executed (on the server) and the browser view is rerendered. Might throw (reject response) when there is a problem with the action execution.
   */
  private requestAction = (actionType: types.BrowserAction, data: Record<string, unknown>) => this.messageChannel?.request({ type: types.BrowserAction[actionType], data })
    .then((responseMessage) => {
      const { RecordingState } = this.state;
      if (RecordingState.isRecording) {
        this.setState((prevState) => (
          {
            RecordingState: {
              ...prevState.RecordingState,
              recording:
              {
                ...prevState.RecordingState.recording,
                actions: [...prevState.RecordingState.recording.actions,
                  (responseMessage as any).payload],
              },
            },
          }
        ));
      }
    })
    .then(this.initRender())
    .catch((e) => {
      alert(`Action failed.\n\n${e.message ? `Reason: ${e.message.split('\n')[0]}` : ''}`);
      throw (e); // throwing again (just a communication channel, errors should be handled by the requesters!)
    });

  /**
   * "Hacky" solution for stopping the playback.
   * @returns The promise gets normaly immediately resolved, when the class member stopSignal is set, the promise gets rejected (which then disables the playback).
   */
  private stop = () => new Promise<void>((res, rej) => {
    if (this.stopSignal) rej(new Error('Execution stopped by user.')); else res();
  });

  /**
   * "Hacky" solution for the playback "Step" functionality.
   * @returns The promise's resolve function is exposed as a private class member step, pressing the "Next Step button" calls this function, resulting in the Promise getting resolved and the playback resumed.
   */
  private stepper = () => new Promise<void>((res) => {
    this.step = res;
  });

  /**
   * Starts the playback session.
   * @param {boolean} step - If true, the playback will wait for the stepper() promise to resolve with every action (next step button click).
   * @returns Gets resolved after the recording has ended (rejected if there was an error during the playback).
   */
  private playRecording = (step = false) : Promise<void> => {
    this.setState((prevState) => (
      {
        RecordingState: {
          ...prevState.RecordingState,
          isRecording: false,
          playback: step ? 'step' : 'cont',
        },
      }
    ));
    const { RecordingState } = this.state;
    RecordingState.playback = step ? 'step' : 'cont';

    if (RecordingState.recording.actions) { //! == []
      /* Sends all actions to server, waits for ACK (promise resolve) after every sent action. */
      return [{ idx: -1, type: 'reset', data: {} },
        ...RecordingState.recording.actions.map((x, idx) => ({ idx, type: (x.type), data: x.data })),
      ].reduce((p : Promise<any>, action) => p.then(() => {
        this.setState((prevState) => (
          {
            RecordingState: {
              ...prevState.RecordingState,
              playbackError: '',
              currentActionIdx: action.idx,
            },
          }
        ), this.initRender());
        return Promise.all([
          this.messageChannel?.request(action),
          RecordingState.playback === 'step' ? this.stepper() : Promise.resolve(),
          this.stop(),
        ]);
      }).catch((e) => {
        this.stopSignal = false;
        this.setState((prevState) => (
          {
            RecordingState: {
              ...prevState.RecordingState,
              playback: null,
              playbackError: e.message,
            },
          }
        ));
        return Promise.reject(e);
      }), Promise.resolve())
        .then(() => this.setState((prevState) => (
          {
            RecordingState: {
              ...prevState.RecordingState,
              playback: null,
              currentActionIdx: -1, // removes highlight after playback
            },
          }), this.initRender()));
    }
    return Promise.resolve();
  };

  /**
   * Prompts the user for the text to paste to the website, then requests an insertText action.
   */
  private insertText = () => {
    const text = prompt('Enter text to paste to the website:');
    if (text !== null && text !== '') {
      this.requestAction(types.BrowserAction.insertText, { text });
    }
  };

  /**
   * "Router" method (used mainly as a callback in child components) for the playback/recording control.
   * @param {string} action - Type of the requested action (play|record|step|stop).
   */
  private recordingControl = (action : string) => {
    const { RecordingState } = this.state;
    const { recording, isRecording } = RecordingState;

    switch (action) {
      case 'play':
        if (window.confirm('Starting the playback closes all open tabs. Do you want to proceed?')) {
          this.playRecording().catch(() => {});
        }
        break;
      case 'record':
        if (!isRecording) {
          if (!window.confirm('Starting the recording session closes all open tabs. Do you want to proceed?')) {
            break;
          }
          if (!recording) { // recording === []
            this.messageChannel?.send({ type: 'reset', data: {} });
          }
        } else {
          postAPI('updateRecording', recording).catch(console.log);
        }

        (!isRecording ? this.playRecording() : Promise.resolve()).then(() => this.setState((prevState) => (
          {
            RecordingState: {
              ...prevState.RecordingState,
              isRecording: !prevState.RecordingState.isRecording,
            },
          }))).catch(() => {}); // if playback fails, recording does not start.
        break;
      case 'step':
        if (RecordingState.playback === 'step') {
          this.step();
        } else {
          this.playRecording(true).catch(() => {});
        }
        break;
      case 'stop':
        this.stopSignal = true;
        this.step(); // to resolve the pending "Step" promise, which would block the termination of the playback otherwise.
        this.setState((prevState) => ({ RecordingState: { ...prevState.RecordingState, playbackError: '', currentActionIdx: -1 } }));
        break;
      default:
        throw new Error(`Unrecognized action ${action}!`);
    }
  };

  /**
   * Clears the internal screen buffer and requests first two screens on the page.
   * @returns IIFE-style function to be called when complete rerendering is required.
   */
  private initRender() {
    return (() => {
      this.canvas.current?.resetView();
      this.requestedScreens = [];
      this.requestScreenshot(0);
      this.requestScreenshot(1);
    });
  }

  render() : JSX.Element {
    const {
      loading, ok, RecordingState, TabState,
    } = this.state;

    if (loading) {
      return (<p>Loading...</p>);
    }
    if (!ok) {
      return (
        <p>
          This recording is broken.
          <a href="../">Go back...</a>
        </p>
      );
    }

    return (
      <div className="App">
        <Container fluid>
          <Row style={{ height: `${10}vh`, lineHeight: `${10}vh` }}>
            <Col md={2}>
              <p id="goBack" style={{ fontSize: `${120}%` }}>
                <a href="../">
                  &lt;
                  {RecordingState.recording.name}
                </a>
              </p>
            </Col>
          </Row>
          <Row style={{ height: `${90}vh` }}>
            <>
              <Col xs={3}>
                <SideBar recordingState={RecordingState} control={this.recordingControl} recordingModifier={this.recordingModifier} />
              </Col>
              <Col xs={9}>
                <Container fluid>
                  <ToolBar tabState={TabState} navigationCallback={this.requestAction} />
                  <Button onClick={this.insertText}>Insert Text</Button>
                  <Row>
                    <StreamWindow ref={this.canvas} actionSender={this.requestAction} screenRequester={this.requestScreenshot} />
                  </Row>
                </Container>
              </Col>
            </>
          </Row>
        </Container>
      </div>
    );
  }
}
