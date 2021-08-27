const EventEmitter = require('events');
import type { Browser } from '../playwright/src/client/browser';
import type { Page } from '../playwright/src/client/page';

/**
 * Class for handling the browser tab management.
 */
class TabManager extends EventEmitter {
    /**
     * Associated Playwright Browser object.
     */
    private _browser : Browser;
    /**
     * Functions or paths to scripts to be injected to every new page.
     */
    private _injections : ({path:string}|Function)[] = [];
    /**
     * Playwright Page object exposing the currently selected page.
     */
    public currentPage : Page;

    /**
     * Constructor for the TabManager class
     * @param browser Sessions Playwright Browser object
     */
    constructor(browser : Browser){
        super();
        this._browser = browser;
    }

    /**
     * Getter method for listing all the managed tabs (Playwright Page objects) in all contexts.
     * @returns List of currently active tabs / pages.
    */
    private get _pages() : Page[]{
	    return this._browser.contexts()
			.map(context => context.pages())
			.reduce((acc,pages) => [...acc,...pages], [])
    }

    /**
     * Helper method for emiting the "tabsUpdate" event (listened to by BrowserSession) with the list of all tabs.
    */
    private notifyStateChange() : void{
        this.emit("tabsUpdate", this.listAllTabs());
    }

    /**
     * Helper method to sideload scripts into a new page as well as bind some listeners and introduce the "tabName" member variable into the page (for easier tab name retrieval).
     * @param page Current page to be bootstrapped.
     * @returns Promise gets resolved after the given page is bootstrapped with the specified scripts.
     */
    private async _pageBootstrapper(page : Page) : Promise<void>{
        page['tabName'] = "Loading...";

        page.on('domcontentloaded', async () => {
            try{
                page['tabName'] = await page.title();
                this.notifyStateChange();
            }
            catch{} // not optimal, just suppressing exceptions (exceptions usually stem from quick navigation, so no biggie, but still.) 
            
        });

        page.on('popup', async (popup: Page) => {
            await this._pageBootstrapper(popup);
        })

        for(let injected of this._injections){
            await page.addInitScript(injected);
        }

        //Reload is needed for the injected scripts to get loaded (will this break anything?)
        await page.reload(); 
    }

    /**
     * Gets the current state of the browser tabs (current tab id and list of tab titles).
     * @returns List of open tabs and the current tab id.
     */
    public listAllTabs() : any{
        let currentTab : number = -1;

        for(const [idx, page] of this._pages.entries()){
            if(page === this.currentPage){
                currentTab = idx;
                break;
            }
        }
        
        let tabList = this._pages.map(page => page['tabName']);
        
		return {currentTab: currentTab, tabs: tabList};
	}

    /**
     * Closes all the current browser contexts and opens up a blank page.
     * @returns Promise gets resolved after the blank page is open.
     */
    public async recycleContext() : Promise<void> {
        const contexts = this._browser.contexts();
        
        for(let context of contexts){
            await context.close();
        };

        await this.newTab();
    }

    /**
     * Opens up a new page in the last existing (running) context. If there is no running context, it gets created with some default options.
     * @param url Optional - url to open the page with.
     * @returns Promise gets resolved after the new page is open, bootstrapped and on the specified URL (if applicable).
     */
	public async newTab(url? : string) : Promise<void>{
        if(this._browser.contexts().length === 0){
            // For freshly created (or recycled) browser without context
            console.log("Creating new context...");
            await this._browser.newContext({locale: 'en-GB'});
        }


        let currentContext = this._browser.contexts()[this._browser.contexts().length-1];

		this.currentPage = await currentContext.newPage();
        await this._pageBootstrapper(this.currentPage);
        
        if(typeof(url) === "string"){
            await this.currentPage.goto(url);
        }
	}

    /**
     * Closes the specified page. Handles possible termination of the current page, changes current page id accordingly.
     * @param idx id of the page to be closed (index in the _pages array) or the Page object itself.
     * @returns Promise, gets resolved when the page is successfully closed.
     */
    public async closeTab(idx: number | Page) : Promise<void>{
        if(typeof idx !== 'number'){
            idx = 
            (() => {
            for(let i = 0; i < this._pages.length; i++){
                if(this._pages[i] == idx){
                    return i;
                }
            }
            throw "Page could not be found :(";
            })();
        }
        
        await this._pages[idx].close();

        if(this.currentPage.isClosed()){
             //If we did not close the last tab, the new focused tab will be the successor of the closed one (otherwise we pick the new last one).
            this.currentPage = this._pages[idx !== this._pages.length ? idx : this._pages.length - 1];    
        }
            
        this.notifyStateChange();
    }

    /**
     * Injects the specified function/script to all the active pages, stores it in the _injections array for the future pages (to be used during bootstrapping).
     * @param arg Function (or path to the script file) to be injected
     * @returns Promise, gets resolved when all the existing pages have been reloaded with the new script injected.
     */
    // The argument is either a JS function or an object with a path to a script (see documentation of Page.addInitScript)
    // Once registered, the injected script survives reloads and navigation.
    public async injectToAll(arg: (Function|{path: string})) : Promise<void>{
        this._injections.push(arg);

        for(let page of this._pages){
            await page.addInitScript(arg);
            await page.reload();
        }
    }

    /**
     * Changes the currentPage.
     * @param newTab index of the new tab in the _pages array
     */
    // switchTabs does not have to be async, since Playwright internally does not 'switch' tabs,
    //  and the switching mechanism is solely user-side.
    public switchTabs(newTab: number) : void{
        this.currentPage = this._pages[newTab];

        this.notifyStateChange();
    }
}

export {TabManager};