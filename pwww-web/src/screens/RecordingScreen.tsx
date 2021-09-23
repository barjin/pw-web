/* eslint-disable max-len */
import {
  Button, Container, Row, Col,
} from 'react-bootstrap';
import React, { Component, createRef } from 'react';

import querystring from 'querystring';
import * as types from 'pwww-shared/Types';
import ToolBar from '../components/ToolBar';
import SideBar from '../components/SideBar';

import { getAPI, postAPI } from '../RestAPI';
import StreamWindow from '../components/StreamWindow';
import RemoteBrowser from '../RemoteBrowser';

import '../App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const APP_PORT = 8080;

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
 * Convenience class for communication with the remote browser.
 */
  private Browser: RemoteBrowser;

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

    this.Browser = new Proxy(new RemoteBrowser(), {
      get: (o, key) => {
        const { RecordingState } = this.state;
        if (!RecordingState.isRecording) {
          return async (...args: any[]) => {
            const response = await (o[key as any] as ((...a: any[]) => any))(...args);
            if (response) {
              this.setState((prevState) => ({
                RecordingState: {
                  ...prevState.RecordingState,
                  recording:
                  {
                    ...prevState.RecordingState.recording,
                    actions: [...prevState.RecordingState.recording.actions,
                      (response as any)],
                  },
                },
              }));
            }
          };
        }
        return o[key as any];
      },
    });
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
        }), this.streamSetup);
      }).catch(() => {
        this.setState({
          loading: false,
          ok: false,
        });
      });
  }

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
            this.Browser.reset();
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
* Bootstrapping method for starting all the necessary connections and binding the event handlers.
*/
  private streamSetup = () => {
    if (this.canvas.current) {
      // const { RecordingState } = this.state;
      this.Browser.connectToServer(window.location.hostname, APP_PORT);
      this.Browser.screencastCallback = this.canvas.current.DrawImage;
    } else {
      throw new Error('The canvas is not ready.');
    }
  };

  /**
* Helper method to facilitate client->server requests and recording mechanism.
*
* Requests the specified action via the messagingChannel (ACK channel), if the recording session is active, the action gets recorded.
* @param {types.BrowserAction} actionType - Type (defined in the types.BrowserAction enum) of the requested action.
* @param {object} data - Object with the action-type-dependent data.
* @returns Promise gets resolved when the Action is executed (on the server) and the browser view is rerendered. Might throw (reject response) when there is a problem with the action execution.
*/
  // private requestAction = (actionType: types.BrowserAction, data: Record<string, unknown>) => ((this.Browser as any)[types.BrowserAction[actionType]] as Function)(data)
  //   .then((responseMessage : Object) => {
  //     const { RecordingState } = this.state;
  //   })
  //   .catch((e: Error) => {
  //     alert(`Action failed.\n\n${e.message ? `Reason: ${e.message.split('\n')[0]}` : ''}`);
  //     throw (e); // throwing again (just a communication channel, errors should be handled by the requesters!)
  //   });

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
        ));
        return Promise.all([
          (this.Browser[action.type] as (...args: any[]) => Promise<Record<string, unknown>>)(...action.data),
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
          })));
    }
    return Promise.resolve();
  };

  /**
* Prompts the user for the text to paste to the website, then requests an insertText action.
*/
  private insertText = () => {
    const text = prompt('Enter text to paste to the website:');
    if (text !== null && text !== '') {
      this.Browser.insertText(text);
    }
  };

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
                  <ToolBar tabState={TabState} browser={this.Browser} goto={this.Browser.goto} />
                  <Button onClick={this.insertText}>Insert Text</Button>
                  <Row>
                    <StreamWindow ref={this.canvas} browser={this.Browser} />
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
