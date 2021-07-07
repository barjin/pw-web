import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Row from "react-bootstrap/Row";

import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';

import {Component, useState} from "react";


function ToolBar(props) {

  const navigate = (ev) => {
      props.navigationCallback('navigate',{ back: (ev.currentTarget.id === "nav_back") });
  }

  const [address, setAddress] = useState("");

  const browse = (ev) => {
      ev.preventDefault();
      props.navigationCallback('browse', {url: address});
      document.getElementById("addressBar").value = "";
  }

  return(
      <>
      <Row>
        <Form onSubmit={browse} style={{flexGrow: 1}}>
          <InputGroup>
              <InputGroup.Prepend>
                <ButtonGroup>
                    <Button id="nav_back" onClick={navigate}>&lt;</Button>
                    <Button id="nav_forward" onClick={navigate}>&gt;</Button>
                </ButtonGroup>
              </InputGroup.Prepend>
                <>
                  <FormControl type='text' id="addressBar" placeholder='https://apify.com' onChange={e => setAddress(e.target.value)} />
                  <Button type='submit' variant="outline-success">-&gt;</Button>
                </>
          </InputGroup>
          </Form>
        </Row>
      <TabBar tabState={props.tabState} callback={props.navigationCallback} />
      </>
  );
}


class BrowserTab extends Component{
    shouldComponentUpdate(prevProps){
      return (this.props.title !== prevProps.title || this.props.active !== prevProps.active);
    }
  
    render(){
      return(
      <ButtonGroup style={{marginRight: 5+"px"}}>
        <Button onClick={() => this.props.clickHandler(this.props.tab_id)} variant={this.props.active ? "dark" : "secondary"}>
          {this.props.title}
        </Button>
        {this.props.static ? "" : <Button onClick={this.props.closeHandler} variant="dark">X</Button>}
      </ButtonGroup>
      );
    }
  };

class TabBar extends Component{
  
    tabClick = (id) => {
      this.props.callback('switchTabs',{currentTab: id});
      console.log("Switching tabs (current tab is: " +  id + ")");
      this.setState({currentTab: id});
    }
  
    addTab = (e) => { 
      this.props.callback('openTab',{});
    }
  
    closeTab = (id) => {

      if (this.props.tabState.tabs.length === 1) {
        return;
      }
      this.props.callback('closeTab',{closing: id});
    }
  
    render(){ 
      return (
        <Row style={{backgroundColor:"lightgrey"}}>
        <ButtonToolbar>

        {this.props.tabState.tabs.map((tab,id) => 
        (
            <BrowserTab
            title={tab}    
            
            tab_id = {id}

            active = {id === this.props.tabState.currentTab}

            clickHandler = {this.tabClick}
            closeHandler = {() => this.closeTab(id)}
            />
        ))}

        <BrowserTab clickHandler={this.addTab} title="+" static={true}/>
        </ButtonToolbar>
        </Row>
      )
    }
  }

export default ToolBar;