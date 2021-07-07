const EventEmitter = require('events');
import type { Browser } from '../playwright/src/client/browser';
import type { BrowserContext } from '../playwright/src/client/browserContext';

import type { Page } from '../playwright/src/client/page';

export type TabList = {currentTab: number, tabs: string[]};

class TabManager extends EventEmitter {
    private _browser : Browser
    public currentPage : Page

    constructor(browser : Browser){
        super();
        this._browser = browser;
    }

    private get _pages() : Page[]{
	    return this._browser.contexts()
			.map(context => context.pages())
			.reduce((acc,pages) => [...acc,...pages], [])
    }

    private notifyStateChange() : void{
        this.emit("tabsUpdate", this.listAllTabs());
    }

    public listAllTabs() : TabList{
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

    public async recycleContext() : Promise<void> {
        const contexts = this._browser.contexts();
        
        for(let context of contexts){
            await context.close();
        };

        await this.newTab();
    }

	public async newTab(url? : string) : Promise<void>{
        const homeURL = "https://wikipedia.org";

        if(this._browser.contexts().length === 0){
            // For freshly created (or recycled) browser without context
            await this._browser.newContext();
        }

        let currentContext = this._browser.contexts()[this._browser.contexts().length-1];
		this.currentPage = await currentContext.newPage();
        
        this.currentPage['tabName'] = "Loading...";
        this.currentPage.on('domcontentloaded', async () => {
            this.currentPage['tabName'] = await this.currentPage.title();
            this.notifyStateChange()
        });

		await this.currentPage.goto(typeof(url) === "string" ? url : homeURL);
	}

    public async closeTab(idx: number) : Promise<void>{
        await this._pages[idx].close();

        if(this.currentPage.isClosed()){
             //If we did not close the last tab, the new focused tab will be the successor of the closed one (otherwise we pick the new last one).
            this.currentPage = this._pages[idx !== this._pages.length ? idx : this._pages.length - 1];    
        }
            
        this.notifyStateChange();
    }

    // switchTabs does not have to be async, since Playwright internally does not 'switch' tabs,
    //  and the switching mechanism is solely user-side.
    public switchTabs(newTab: number) : void{
        this.currentPage = this._pages[newTab];

        this.notifyStateChange();
    }


}

export default TabManager;