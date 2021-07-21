import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table'

import { Component } from 'react';

class RecordingsTable extends Component{
    constructor(props){
        super(props);
        this.columns = ["Name", "Modified on"];
        this.fields = ["name", "createdOn"];
        this.state = {
                      loading: true,
                      recordings: []
        };
    }

    componentDidMount(){
        this.setState({loading: true});
        fetch("http://localhost:8000/recordings").then(x => x.json()).then(recordings => {
            this.setState({
                loading: false,
                recordings: recordings
            });
        });
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
                    {this.fields.map((field, id) =>
                        <td key={id}>{x[field]}</td>
                    )}
                </tr>
                ))
                }
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