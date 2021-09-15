/* eslint-disable max-len */
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';

import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import React, { Component } from 'react';

import { postAPI, getAPI } from '../RestAPI';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface IEmpty {}

interface IRecordingsTableState {
  loading: boolean,
  recordings: { id: number, name: string, createdOn: string }[]
}

/**
 * React class component representing the main menu recordings table.
 */
class RecordingsTable extends Component<IEmpty, IRecordingsTableState> {
/**
 * The table column headers.
 */
  columns : string[] = ['Name', '', 'Modified on'];

  constructor(props : IEmpty) {
    super(props);
    this.state = {
      loading: true,
      recordings: [],
    };
  }

  componentDidMount() {
    this.loadRecordings();
  }

  /**
* Helper method for simple recordings reload.
*
* Sends a GET request to the REST API, updates React state accordingly.
*/
  loadRecordings = () : void => {
    this.setState({ loading: true });
    getAPI('recordings').then((recordings) => {
      this.setState({
        loading: false,
        recordings: (recordings.data as any),
      });
    }).catch(() => {
      this.setState({
        loading: false,
        recordings: [],
      });
    });
  };

  /**
* Rename button callback method.
*
* Prompts the user for the new recording's name, then sends a POST request to the according REST API endpoint. If successful, reloads the table's content.
* @param {number} recordingId - ID of the recording being renamed
*/
  renameRecording = (recordingId : number) => {
    const newName = prompt('Enter new recording name...');
    if (newName !== null) {
      postAPI('renameRecording', { id: recordingId, newName })
        .then(this.loadRecordings).catch(alert);
    }
  };

  /**
* Delete button callback method.
*
* Asks the user to confirm their decision, then sends a POST request to the according REST API endpoint. If successful, reloads the table's content.
* @param {number} recordingId - ID of the recording being deleted
*/
  deleteRecording = (recordingId: number) => {
    if (window.confirm('Do you really want to delete this recording?')) {
      postAPI('deleteRecording', { id: recordingId })
        .then(this.loadRecordings).catch(alert);
    }
  };

  /**
* New recording button callback method.
*
* Prompts the user for the new recording's name, then sends a POST request to the according REST API endpoint. If successful, reloads the table's content.
* @returns {void}
*/
  addNewRecording() {
    const name = `recording_${new Date().valueOf()}`;
    postAPI('newRecording', { name })
      .then(this.loadRecordings).catch(alert);
  }

  render() {
    const recordingActions : Record<string, (id: number) => void> = {
      rename: this.renameRecording,
      delete: this.deleteRecording,
    };

    const { loading, recordings } = this.state;
    return (
      <Table striped bordered hover>
        <thead>
          <tr key={0}>
            {
this.columns.map((x, id) => (
// eslint-disable-next-line react/no-array-index-key
  <td key={id}>
    {x}
  </td>
))
}
          </tr>
        </thead>
        <tbody>
          {
loading ? <tr><td> Loading... </td></tr>
  : recordings.map((x) => (
    <tr key={x.id}>
      <td>
        <a href={`/recording?id=${x.id}`}>{x.name}</a>
      </td>
      <td>
        <ButtonGroup vertical>

          {Object.entries(recordingActions).map(([key, value]) => <Button variant="outline-primary" onClick={() => value(x.id)}>{key}</Button>)}
        </ButtonGroup>
      </td>
      <td>{x.createdOn}</td>
    </tr>
  ))
}
          <tr>
            <td>
              <Button onClick={() => { this.addNewRecording(); }}>New recording</Button>
            </td>
          </tr>
        </tbody>
      </Table>
    );
  }
}

function Footer() : JSX.Element {
  return (
    <Row
      style={{
        position: 'fixed', bottom: '0px', left: '0px', width: '100%', backgroundColor: '#040404', padding: '10px',
      }}
    >
      <Col>
        <a href="https://github.com/barjin/pw-web">GitHub</a>
      </Col>
      <Col>
        <a href="https://barjin.github.io/pw-web/">Documentation</a>
      </Col>
      <Col>
        <a href="mailto: jindrichbar@gmail.com">Contact me</a>
      </Col>
    </Row>
  );
}

/**
* Home Screen functional React component.
* @returns The homescreen being rendered.
*/
export default function HomeScreen() {
  return (
    <div className="App">
      <Container fluid>
        <Row>
          <Col>
            <h1>PWWW, Browser recorder for Playwright</h1>
          </Col>
        </Row>
        <Row className="justify-content-md-center">
          <Col md={7}>
            <RecordingsTable />
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
}
