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

class RecordingsTable extends Component<IEmpty,IRecordingsTableState>{
    columns : String[] = ["Name", "Modified on"];

    constructor(props : IEmpty){
        super(props);
        this.state = {
            loading : true,
            recordings: []
        };
    }

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

    renameDialog(recordingId : number){
        let newName = prompt("Enter new recording name...");
        if(newName !== null){
            postAPI("renameRecording", {id: recordingId, newName : newName})
            .then(
                response => {
                    if(response.ok){
                        this.loadRecordings();
                    }
                    else{
                        alert(response.data);
                    }
                }
            );
        }
    }

    addNewRecording(){
        let name = prompt("Enter new recording name...");
        if(name !== null){
            postAPI("newRecording",{name: name})
            .then(
                response => {
                    if(response.ok){
                        this.loadRecordings();
                    }
                    else{
                        alert(response.data);
                    }
                }
            );
        }
    }

    render(){
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
                    <td><a href={"/recording?id=" + x.id}>{x.name}</a> <a href="#" onClick={() => this.renameDialog(x.id)}>rename</a></td>
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
                    <RecordingsTable/>
                </Col>
            </Row>
        </Container>
      </div>
    );
  }