import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table'
import { Component } from 'react';

import { postAPI, getAPI } from '../restAPI'

interface IEmpty {};

interface IRecordingsTableState {
    loading: boolean,
    recordings: {id: number, name: string, createdOn: string}[]
}

/**
 * React class component representing the main menu recordings table.
 */
class RecordingsTable extends Component<IEmpty,IRecordingsTableState>{
    /**
     * The table column headers.
     */
    columns : String[] = ["Name", "", "Modified on"];

    constructor(props : IEmpty){
        super(props);
        this.state = {
            loading : true,
            recordings: []
        };
    }

    /**
     * Helper method for simple recordings reload.
     * 
     * Sends a GET request to the REST API, updates React state accordingly.
     */
    loadRecordings = () : void => {
        this.setState({loading: true});
        getAPI("recordings").then(recordings => {
            this.setState({
                loading: false,
                recordings: (recordings.data as any)
            })
        }).catch(e => {
            this.setState({
                loading: false,
                recordings: []
            })
        });
    }

    componentDidMount(){
        this.loadRecordings();
    }

    /**
     * Rename button callback method.
     * 
     * Prompts the user for the new recording's name, then sends a POST request to the according REST API endpoint. If successful, reloads the table's content.
     * @param {number} recordingId - ID of the recording being renamed
     */
    renameRecording = (recordingId : number) => {
        let newName = prompt("Enter new recording name...");
        if(newName !== null){
            postAPI("renameRecording", {id: recordingId, newName : newName})
            .then(this.loadRecordings).catch(alert);
        }
    }

    /**
     * New recording button callback method.
     * 
     * Prompts the user for the new recording's name, then sends a POST request to the according REST API endpoint. If successful, reloads the table's content.
     * @returns {void}
     */
    addNewRecording(){
        let name = prompt("Enter new recording name...");
        if(name !== null){
            postAPI("newRecording",{name: name})
            .then(this.loadRecordings).catch(alert);
        }
    }

    /**
     * Delete button callback method.
     * 
     * Asks the user to confirm their decision, then sends a POST request to the according REST API endpoint. If successful, reloads the table's content.
     * @param {number} recordingId - ID of the recording being deleted
     */
    deleteRecording = (recordingId: number) => {
        if(window.confirm("Do you really want to delete this recording?")){
            postAPI("deleteRecording",{id: recordingId})
            .then(this.loadRecordings).catch(alert);
        }
    }

    render(){
        const recordingActions : object = {
            "rename": this.renameRecording,
            "delete": this.deleteRecording,
        }
        return (
            <Table striped bordered hover>
            <thead>
            <tr key={0}>
                {
                this.columns.map((x,id) => (
                    <td key={id}>
                        {x}
                    </td>
                ))}
            </tr>
            </thead>
            <tbody>
                {
                this.state.loading ? <tr><td> Loading... </td></tr>
                :
                this.state.recordings.map(x => (
                <tr key={x.id}>
                    <td>
                        <a href={"/recording?id=" + x.id}>{x.name}</a> 
                    </td>
                    <td>
                        <ul>
                        {Object.entries(recordingActions).map(([key, value]) => 
                            {
                                return <li><a href="#" onClick={()=>value(x.id)}>{key}</a></li>
                            }
                        )}
                        </ul>
                    </td>
                    <td>{x.createdOn}</td>
                </tr>
                ))
                }
                <tr>
                    <td>
                        <a href="#" onClick={()=>{this.addNewRecording()}}>New recording</a>
                    </td>
                </tr>
            </tbody>
            </Table>
        );
    }

}

/**
 * Home Screen functional React component.
 * @returns The homescreen being rendered.
 */
function HomeScreen() { 
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
                    <RecordingsTable/>
                </Col>
            </Row>
        </Container>
      </div>
    );
  }

  export {HomeScreen}