import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Row from "react-bootstrap/Row";

import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';

import {useState} from "react";

import * as types from 'pwww-shared/types'

type ToolBarProps = {
  tabState: types.BrowserState['tabState'],
  navigationCallback : (action : types.BrowserAction, data: object) => void
}

function ToolBar(props: ToolBarProps) {

  const navigate = (ev : React.MouseEvent<HTMLElement>) => {
    if(ev.currentTarget !== null){
      props.navigationCallback(
        types.BrowserAction.navigate,
        { back: ((ev.currentTarget as HTMLElement).id === "nav_back") }
      );
    }
  }

  const [address, setAddress] = useState("");

  const browse = (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      props.navigationCallback(
        types.BrowserAction.browse, 
        {url: address}
      );
      (document.getElementById("addressBar") as HTMLInputElement).value = "";
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

interface IBrowserTabProps{
  title : string,
  active?: boolean,
  tab_id: number
  clickHandler: (id: number) => void,
  closeHandler?: () => void,
  static? : boolean
}

function BrowserTab(props: IBrowserTabProps){
    return(
    <ButtonGroup style={{marginRight: 5+"px"}}>
      <Button onClick={() => props.clickHandler(props.tab_id)} variant={props.active ? "dark" : "secondary"}>
        {props.title}
      </Button>
      {props.static ? "" : <Button onClick={props.closeHandler} variant="dark">X</Button>}
    </ButtonGroup>
    );
  };

interface ITabBarProps{
  callback : ToolBarProps['navigationCallback']
  tabState: {currentTab: number, tabs: string[]};
}

function TabBar(props: ITabBarProps){
    const tabClick = (id: number) => {
      props.callback(
        types.BrowserAction.switchTabs,
        {currentTab: id}
      );
      console.log("Switching tabs (current tab is: " +  id + ")");
    }
  
    const addTab = (_: number) => { 
      props.callback(
        types.BrowserAction.openTab,
        {}
      );
    }
  
    const closeTab = (id: number) => {
      if (props.tabState.tabs.length === 1) {
        return;
      }
      props.callback(
        types.BrowserAction.closeTab,
        {closing: id}
      );
    }
  
    return (
        <Row style={{backgroundColor:"lightgrey"}}>
        <ButtonToolbar>

        {props.tabState.tabs.map((tab,id) => 
        (
            <BrowserTab
            title={tab?.length > 15 ? tab.substring(0,15)+"…": tab}    
            
            tab_id = {id}

            active = {id === props.tabState.currentTab}

            clickHandler = {tabClick}
            closeHandler = {() => closeTab(id)}
            />
        ))}

        <BrowserTab tab_id={-1} clickHandler={addTab} title="+" static={true}/>
        </ButtonToolbar>
        </Row>
      )
  }

export default ToolBar;