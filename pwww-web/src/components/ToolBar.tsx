/* eslint-disable max-len */
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Row from 'react-bootstrap/Row';

import Form from 'react-bootstrap/Form';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';

import React, { useState } from 'react';

import * as types from 'pwww-shared/Types';
import RemoteBrowser from '../RemoteBrowser';

interface IBrowserTabProps{
  title : string,
  active?: boolean,
  tabID: number
  clickHandler: (id: number) => void,
  closeHandler?: () => void,
  stable? : boolean
}

/**
 * Single browser tab as a functional React component.
 * @param {IBrowserTabProps} props - React props object containing tab data (title, id...) as well as click and close handlers.
 * @returns The rendered browser tab.
 */
function BrowserTab(props: IBrowserTabProps) {
  const {
    clickHandler, closeHandler, tabID, active, title, stable,
  } = props;
  return (
    <ButtonGroup style={{ marginRight: `${5}px` }}>
      <Button onClick={() => clickHandler(tabID)} variant={active ? 'dark' : 'secondary'}>
        {title}
      </Button>
      {stable ? '' : <Button onClick={closeHandler} variant="dark">X</Button>}
    </ButtonGroup>
  );
}

BrowserTab.defaultProps = {
  active: false,
  closeHandler: () => { throw new Error('Dummy close handler!'); },
  stable: false,
};

interface ITabBarProps{
  browser : ToolBarProps['browser']
  tabState: types.AppState['TabState'];
}

/**
 * Tab Bar as a functional React component.
 *
 * Encapsulates multiple BrowserTab elements and renders them in line, passing the callback functions into them.
 * @param {ITabBarProps} props - React props object containing tab state and callbacks for tab management.
 * @returns The rendered tab bar.
 */
function TabBar(props: ITabBarProps) {
  const tabClick = (currentTab: number) => props.browser.switchTab({ currentTab });

  const addTab = () => props.browser.openTab();

  const closeTab = (closing: number) => {
    if (props.tabState.tabs.length === 1) {
      return;
    }
    props.browser.closeTab({ closing });
  };

  const { tabState } = props;

  return (
    <Row style={{ backgroundColor: 'lightgrey' }}>
      <ButtonToolbar>

        {tabState.tabs.map((tab, id) => (
          <BrowserTab
            title={tab?.length > 15 ? `${tab.substring(0, 15)}…` : tab}
            key={id} // eslint-disable-line react/no-array-index-key
            tabID={id}
            active={id === tabState.currentTab}
            clickHandler={tabClick}
            closeHandler={() => closeTab(id)}
          />
        ))}

        <BrowserTab tabID={-1} clickHandler={addTab} title="+" stable />
      </ButtonToolbar>
    </Row>
  );
}

type ToolBarProps = {
  tabState: types.AppState['TabState'],
  browser : RemoteBrowser,
  goto: (arg0: { url: string })=>void
};

/**
 * Functional React component containing the upper browser toolbar (list of open tabs, address bar, go back/ go forward buttons).
 * @param {ToolBarProps} props - Reacts props object containing the tab state and navigation function for browsing and back/forward navigation
 * @returns The rendered toolbar.
 */
export default function ToolBar(props: ToolBarProps) : JSX.Element {
  const { tabState, browser } = props;
  const [address, setAddress] = useState('');

  // eslint-disable-next-line
  const navigate = (back: boolean) : (ev: MouseEvent) => Promise<Object> => ((back) ? () => browser.goBack() : () => browser.goForward());

  const browse = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    browser.goto({ url: address });
    (document.getElementById('addressBar') as HTMLInputElement).value = '';
  };

  return (
    <>
      <Row>
        <Form onSubmit={browse} style={{ flexGrow: 1 }}>
          <InputGroup>
            <InputGroup.Prepend>
              <ButtonGroup>
                <Button id="nav_back" onClick={navigate(true) as any}>&lt;</Button>
                <Button id="nav_forward" onClick={navigate(false) as any}>&gt;</Button>
              </ButtonGroup>
            </InputGroup.Prepend>
            <>
              <FormControl type="text" id="addressBar" placeholder="https://apify.com" onChange={(e) => setAddress(e.target.value)} />
              <Button type="submit" variant="outline-success">-&gt;</Button>
            </>
          </InputGroup>
        </Form>
      </Row>
      <TabBar tabState={tabState} browser={browser} />
    </>
  );
}
