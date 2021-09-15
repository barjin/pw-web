/* eslint-disable max-len */
import EventEmitter from 'events';
import { Browser, Page, Response } from 'playwright';

/**
 * Class for handling the browser tab management.
 */
export default class TabManager extends EventEmitter {
/**
 * Associated Playwright Browser object.
 */
  private browser : Browser;

  /**
 * Functions or paths to scripts to be injected to every new page.
 */
  private injections : ({ path:string } | Function)[] = []; /* eslint-disable-line @typescript-eslint/ban-types */

  /**
 * Playwright Page object exposing the currently selected page.
 */
  public currentPage : Page|null = null;

  /**
 * Constructor for the TabManager class
 * @param browser Sessions Playwright Browser object
 */
  constructor(browser : Browser) {
    super();
    this.browser = browser;
  }

  /**
 * Getter method for listing all the managed tabs (Playwright Page objects) in all contexts.
 * @returns List of currently active tabs / pages.
*/
  private get pages() : (Page & { tabName?: string })[] {
    return this.browser.contexts()
      .map((context) => context.pages())
      .reduce((acc, pages) => [...acc, ...pages], []);
  }

  /**
 * Helper method for emiting the "tabsUpdate" event (listened to by BrowserSession) with the list of all tabs.
*/
  private notifyStateChange() : void {
    this.emit('tabsUpdate', this.listAllTabs());
  }

  /**
 * Helper method to sideload scripts into a new page as well as bind some listeners and introduce the "tabName" member variable into the page (for easier tab name retrieval).
 * @param page Current page to be bootstrapped.
 * @returns Promise gets resolved after the given page is bootstrapped with the specified scripts.
 */
  private async pageBootstrapper(page : Page & { tabName?: string }) : Promise<void> {
    page.tabName = 'Loading...';

    page.on('domcontentloaded', async () => {
      try {
        page.tabName = await page.title();
        this.notifyStateChange();
      } catch (e) {
        console.error(e);
      } // not optimal, just suppressing exceptions (exceptions usually stem from quick navigation, so no biggie, but still.)
    });

    page.on('popup', async (popup: Page) => {
      await this.pageBootstrapper(popup);
    });

    const injectedPages:Promise<void>[] = [];
    this.injections.forEach((script) => {
      injectedPages.push(page.addInitScript(script));
    });

    await Promise.all(injectedPages);

    // Reload is needed for the injected scripts to get loaded (will this break anything?)
    await page.reload();
  }

  /**
 * Gets the current state of the browser tabs (current tab id and list of tab titles).
 * @returns List of open tabs and the current tab id.
 */
  public listAllTabs() : { currentTab: number, tabs: string[] } {
    const currentTab = this.pages.findIndex((page) => page === this.currentPage);

    const tabList = this.pages.map((page) => <string>page.tabName);

    return { currentTab, tabs: tabList };
  }

  /**
 * Closes all the current browser contexts and opens up a blank page.
 * @returns Promise gets resolved after the blank page is open.
 */
  public async recycleContext() : Promise<void> {
    const closingContexts:Promise<void>[] = [];
    this.browser.contexts().forEach((context) => {
      closingContexts.push(context.close());
    });

    await Promise.all(closingContexts);

    await this.newTab();
  }

  /**
 * Opens up a new page in the last existing (running) context. If there is no running context, it gets created with some default options.
 * @param url Optional - url to open the page with.
 * @returns Promise gets resolved after the new page is open, bootstrapped and on the specified URL (if applicable).
 */
  public async newTab(url? : string) : Promise<void> {
    if (this.browser.contexts().length === 0) {
      // For freshly created (or recycled) browser without context
      console.log('Creating new context...');
      await this.browser.newContext({ locale: 'en-GB' });
    }

    const currentContext = this.browser.contexts()[this.browser.contexts().length - 1];

    this.currentPage = await currentContext.newPage();
    await this.pageBootstrapper(this.currentPage);

    if (typeof (url) === 'string') {
      await this.currentPage.goto(url);
    }
  }

  /**
 * Closes the specified page. Handles possible termination of the current page, changes current page id accordingly.
 * @param idx id of the page to be closed (index in the pages array) or the Page object itself.
 * @returns Promise, gets resolved when the page is successfully closed.
 */
  public async closeTab(idx: number | Page) : Promise<void> {
    if (typeof idx !== 'number') {
      idx = this.pages.findIndex((page) => page === idx);
      if (idx === -1) throw new Error('Page could not be found :(');
    }

    await this.pages[idx].close();

    if (this.currentPage?.isClosed()) {
      // If we did not close the last tab, the new focused tab will be the successor of the closed one (otherwise we pick the new last one).
      this.currentPage = this.pages[idx !== this.pages.length ? idx : this.pages.length - 1];
    }

    this.notifyStateChange();
  }

  /**
 * Injects the specified function/script to all the active pages, stores it in the injections array for the future pages (to be used during bootstrapping).
 * @param arg Function (or path to the script file) to be injected
 * @returns Promise, gets resolved when all the existing pages have been reloaded with the new script injected.
 */
  // The argument is either a JS function or an object with a path to a script (see documentation of Page.addInitScript)
  // Once registered, the injected script survives reloads and navigation.
  public async injectToAll(arg: (Function | { path: string })) : Promise<void> { /* eslint-disable-line @typescript-eslint/ban-types */
    this.injections.push(arg);

    const injectedPages : Promise<Response | null>[] = [];
    this.pages.forEach((page) => {
      injectedPages.push(page.addInitScript(arg).then(() => page.reload()));
    });

    await Promise.all(injectedPages);
  }

  /**
* Changes the currentPage.
* @param newTab index of the new tab in the pages array
*/
  // switchTabs does not have to be async, since Playwright internally does not 'switch' tabs,
  //  and the switching mechanism is solely user-side.
  public switchTabs(newTab: number) : void {
    this.currentPage = this.pages[newTab];

    this.notifyStateChange();
  }
}
